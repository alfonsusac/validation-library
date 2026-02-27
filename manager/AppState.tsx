import { global } from "./lib/lib-global"
import { createGlobalStore } from "./lib/react-store"

console.log("AppState.tsx reloaded")

const [ getWs ] = global<WebSocket>('__app_ws', () => {
  const ws = new WebSocket("ws://localhost:3000/ws")
  ws.addEventListener("open", () => {
    console.log("WebSocket connected")
  })
  ws.addEventListener("close", () => {
    console.log("WebSocket disconnected")
  })
  return ws
}, () => {
  getWs().close()
})


// The ws store concerns with populating store with data with less duplication as possible.
// It must:
// - 1. request data if data not available (e.g. when component first mounted)
// - 2. listen on server push data and update store accordingly
// - 3. request data update when update function called
// - 4. get the latest store data if data is available on global store

export function appStore<T>(name: string, cb: {
  // Function to request data from server
  requestData: (ws: WebSocket) => void,
  // Function to request data update to server
  requestUpdate: (ws: WebSocket, newData: T) => void,
  // Function to listen on server push data and return new data to update store, or undefined if not relevant
  onMessage: (event: MessageEvent<any>) => T | undefined,
}) {
  // Global Store
  const [ useCachedStore, updateCachedStore, getCachedStore ] = createGlobalStore(name, () => null as T | null)

  function onWsStoreServerUpdate(this: WebSocket, event: MessageEvent<any>) {
    // console.log("server message received!")
    const newData = cb.onMessage(event)
    if (newData !== undefined) updateCachedStore(newData)
  }

  getWs().addEventListener("message", onWsStoreServerUpdate)
  if (import.meta.hot) {
    import.meta.hot.on("bun:beforeUpdate", () => {
      getWs().removeEventListener("message", onWsStoreServerUpdate)
    })
    // DO NOT FORGET to re-register the event listener after update, 
    //  otherwise the store will not receive server push updates after HMR update.
    import.meta.hot.on("bun:afterUpdate", () => {
      getWs().addEventListener("message", onWsStoreServerUpdate)
    })
  }

  // if no initial data, request data from server as soon as possible
  if (!getCachedStore()) {
    if (getWs().readyState !== WebSocket.OPEN) {
      getWs().addEventListener("open", () => cb.requestData(getWs()), { once: true })
    } else {
      cb.requestData(getWs())
    }
  }
  // then listen on server push data and update store accordingly

  type UseStoreReturn<R extends boolean> = R extends true
    ? [ NonNullable<T>, (newData: NonNullable<T>) => void ]
    : [ T, (newData: T) => void ]

  function useStore<R extends boolean>(
    required?: R
  ): R extends true
    ? [ NonNullable<T>, (newData: NonNullable<T>) => void ]
    : [ T, (newData: T) => void ] {

    const [ data ] = useCachedStore()
    if (data === null && required) {
      const err = new Error(`Data for ${ name } is required but not available yet.`)
      Error.captureStackTrace(err, useStore)
      throw err
    }

    function update(newData: T) {
      cb.requestUpdate(getWs(), newData)
    }

    return [ data, update ] as UseStoreReturn<R>
  }

  return [ useStore ] as const
}
// usage: use outside of component




export function query() {

}