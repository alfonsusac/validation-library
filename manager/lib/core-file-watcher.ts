import { watch as fswatch } from "node:fs"
import { onExit } from "./cleanup"
import { Listener } from "./util-listener"








export function createTextFileWatcher<T = string>(
  /* Path relative to cwd. i.e './package.json' */
  path: string,
  codec?: {
    decode: (input: Bun.BunFile) => Promise<T>,
    encode: (input: T) => Promise<string | Bun.ArrayBufferView | ArrayBuffer | SharedArrayBuffer | Request | Response | Bun.BunFile>,
  },
) {
  const file = Bun.file(path)

  async function read(): Promise<T> {
    return codec ? await codec.decode(file) : await file.text() as T
  }
  async function write(content: T): Promise<void> {
    const encoded = codec ? await codec.encode(content) : (content as string)
    await file.write(encoded)
  }
  // Watch the file for changes

  const listeners = new Listener<T>()

  const watcher = fswatch(path, async (eventType, filename) => {
    if (eventType === 'rename') return
    try {
      const content = await read()
      listeners.emit(content as T)
    } catch (error) {
      console.error(`[File-Watcher] Error reading file ${ path } on change:\n`, error)
    }
  })
  onExit(() => {
    try {
      listeners.clear()
      watcher.close()
    } catch (error) {
      console.error(`Error closing watcher for ${ path }:`, error)
    }
  })

  function onChange(listener: (content: T) => void) {
    listeners.add(listener)
  }

  return {
    read,
    write,

    onChange,
  }
}