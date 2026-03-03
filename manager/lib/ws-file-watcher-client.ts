import { createContext } from "react"
import { createCache } from "./react-store"
import type { WsFileWatcherSchema } from "./ws-file-watcher"

export function fileWatchListener<
  Schema extends WsFileWatcherSchema<string, any>
>(
  path: Schema[ 'path' ],
  wsClient: {
    readyState: number,
    subscribe: (evName: string, handler: (data: any) => void) => void,
    onOpen: (handler: () => void, opts: { once?: boolean }) => void,
    send: (evName: string, data?: any) => void,
  }
) {
  type DataType = Schema[ 'data' ]
  const store = createCache<DataType | undefined>(() => undefined)

  wsClient.subscribe(`global:updated:${ path }`, (data: DataType) => {
    store.update(data)
  })
  wsClient.subscribe(`get:${ path }`, (data: DataType) => {
    store.update(data)
  })

  const requestData = () => wsClient.send(`get:${ path }`)
  if (wsClient.readyState !== WebSocket.OPEN)
    wsClient.onOpen(requestData, { once: true })
  else requestData()

  function update(payload: DataType) {
    wsClient.send(`update:${ path }`, payload)
  }

  return {
    exists: true,
    path,
    getter: store.get,
    subscribe: store.subscribe,
  }
}


// export const ServerFilesContext = createContext({} as Record<string, ReturnType<typeof fileWatchListener>>)

// export function useServerFile<
//   Path extends string,
//   Required extends boolean = false
//   >() {

//   }

export function createServerFileStore<Map extends {
  [ K: string ]: any
}>() {

}