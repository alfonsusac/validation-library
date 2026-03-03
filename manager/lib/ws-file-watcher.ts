import { watch as fswatch } from "node:fs"
import { onProcessExit } from "./server-cleanup"
import { Listener } from "./util-listener"
import { wsplugin } from "./websocket-plugin"

// what happens if file doesn't exist? -> throw error, or create empty file?
type Codec<T> = {
  decode: (input: Bun.BunFile) => Promise<T>,
  encode: (input: T) => Promise<string | Bun.ArrayBufferView | ArrayBuffer | SharedArrayBuffer | Request | Response | Bun.BunFile>,
}


export function fileWatcher<T>(
  path: `./${ string }`,
  codec: Codec<T>,
) {
  const file = Bun.file(path)
  const listeners = new Listener<T>()

  async function read(): Promise<T> {
    return await codec.decode(file)
  }
  async function write(content: T): Promise<void> {
    await file.write(await codec.encode(content))
  }
  function onChange(listener: (content: T) => void) {
    listeners.add(listener)
  }
  // Watch the file for changes
  const watcher = fswatch(path,
    async (eventType, filename) => {
      if (eventType === 'rename') return
      listeners.emit(await read())
    }
  )
  onProcessExit(() => {
    listeners.clear()
    watcher.close()
  })
  return { read, write, onChange }
}


export function jsonCodec<T>(validate?: (data: any) => T) {
  return {
    decode: async (file: Bun.BunFile): Promise<T> => {
      const content = await file.text()
      const parsed = JSON.parse(content)
      return validate?.(parsed) ?? parsed
    },
    encode: async (data: T): Promise<string> => {
      return JSON.stringify(data, null, 2)
    }
  }
}


export function wsFileWatcher<const P extends `./${ string }`, T>(
  path: P,
  codec: Codec<T>,
) {
  const file = fileWatcher(path, codec)

  type Schema = WsFileWatcherSchema<P, T>
  const plugin = wsplugin({
    name: `fw:${ path }`,
    broadcasts: {
      [ `global:updated:${ path }` ]: (content: T) => content
    } as Schema[ 'broadcasts' ],
    rpcs: {
      [ `get:${ path }` ]: () => file.read(),
      [ `update:${ path }` ]: async (ws: any, newData: T) => {
        await file.write(newData)
      }
    } as Schema[ 'rpcs' ],
  })

  return {
    plugin,
    _schema: null as unknown as WsFileWatcherSchema<P, T>,
  }
}

export type WsFileWatcherSchema<I extends string, T> = {
  data: T,
  path: `./${ I }`,
  broadcasts:
  { [ K in `global:updated:${ I }` ]: (content: T) => T },
  rpcs:
  { [ K in `get:${ I }` ]: (ws: WebSocket) => Promise<T> } &
  { [ K in `update:${ I }` ]: (ws: WebSocket, newData: T) => Promise<void> }
}
