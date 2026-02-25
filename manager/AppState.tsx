import { useEffect, useSyncExternalStore } from "react"
import type { PackageJson } from "./lib/event-package-json"
import { Listener } from "./lib/util-listener"
import { global } from "./lib/global"

type AppState = {
  packageJson: PackageJson | null
}

const [ getWs, setWs ] = global<WebSocket>('__app_ws', () => {
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

const useServerCount = createGlobalStore('count', () => 0)

// const [ appState, setAppState ] = global<AppState>('__app_state', () => ({
//   packageJson: null
// }))
// const [ listeners, setListeners ] = global<Listener<AppState>>('__app_listeners', () => new Listener())

// export function useAppState() {
//   return useSyncExternalStore(
//     (listener) => listeners().add(listener),
//     () => appState(),
//   )
// }




// 

function createGlobalStore<T>(
  name: string,
  init: () => T,
) {
  const [ getter ] = global(`__app_${ name }_store`, () => {
    return ({
      data: init(),
      listeners: new Listener<T>()
    })
  })
  function update(data: T) {
    const store = getter()
    store.data = data
    store.listeners.emit(data)
  }
  function useStore() {
    const data = useSyncExternalStore(
      (listener) => getter().listeners.add(listener),
      () => getter().data,
    )
    return [ data, update ] as const
  }
  const get = () => getter().data
  return [ useStore, update, get ] as const
}


// The ws store concerns with populating store with data with less duplication as possible.
// It must:
// - 1. request data if data not available (e.g. when component first mounted)
// - 2. listen on server push data and update store accordingly
// - 3. request data update when update function called
// - 4. get the latest store data if data is available on global store

export function createWsStore<T>(name: string, cb: {
  // Function to request data from server
  requestData: (ws: WebSocket) => void,
  requestUpdate: (ws: WebSocket, newData: T) => void,
  // Function to listen on server push data and return new data to update store, or undefined if not relevant
  onMessage: (event: Bun.BunMessageEvent<any>) => T | undefined,
}) {
  // Global Store
  const [ useCachedStore, updateCachedStore, getCachedStore ] = createGlobalStore(name, () => null as T | null)

  function onWsStoreServerUpdate(event: Bun.BunMessageEvent<any>) {
    const newData = cb.onMessage(event)
    if (newData !== undefined) updateCachedStore(newData)
  }

  getWs().addEventListener("message", onWsStoreServerUpdate)
  if (import.meta.hot) {
    import.meta.hot.on("bun:beforeUpdate", () => {
      // console.log(`[createWsStore]: Disposing ws store for ${ name } a`)
      getWs().removeEventListener("message", onWsStoreServerUpdate)
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