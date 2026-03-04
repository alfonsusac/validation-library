import * as fs from 'fs'
import { Listener } from './util-listener'
import type { MaybePromise } from 'bun'
import { getErrorCode, getErrorMessage } from './util-get-error-message'


export function FileController<O>(
  path: `./${ string }`,
  reader: (file: Bun.BunFile) => MaybePromise<O>,
  writer: (file: Bun.BunFile, data: O) => MaybePromise<any>,
) {
  const file = Bun.file(path)
  const store = {
    content: undefined as undefined | O,
    watcher: undefined as undefined | fs.FSWatcher,
    listener: new Listener<O>(),
  }

  function get() {
    if (store.content === undefined) throw new Error("File content not loaded yet. Please call initialize() first.")
    return store.content
  }
  async function set(newValue: O) {
    return await writer(file, newValue)
  }
  async function initialize() {
    store.content = await reader(file)
    store.watcher = fs.watch(path, async (evType) => {
      if (evType !== "change") return
      store.content = await reader(file)
      store.listener.emit(store.content)
    })
  }
  function subscribe(callback: (data: O) => void) {
    return store.listener.subscribe(callback)
  }
  function cleanup() {
    store.watcher?.close()
    store.listener.clear()
  }
  return {
    get,
    set,
    initialize,
    subscribe,
    cleanup,
  }
}



export function WatchJsonFile<JSON>(
  path: `./${ string }`,
  options?: {
    onNotExist?: (file: Bun.BunFile) => MaybePromise<JSON>
  }
) {
  return FileController<JSON>(path,
    async (file) => {
      try {
        const text = await file.text()
        return JSON.parse(text)
      } catch (error) {
        if (getErrorCode(error) === "ENOENT") {
          return await options?.onNotExist?.(file)
        }
        throw error
      }
    },
    async (file, data) => {
      return file.write(JSON.stringify(data, null, 2))
    }
  )
}