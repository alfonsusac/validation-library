import { createContext, use, useSyncExternalStore } from "react"
import { Listener } from "./util-listener"

export function createCache<T>(
  init: () => T,
  cleanupFn?: (data: T) => void
) {
  const store = { data: init() }
  const listeners = new Listener<T>()

  function get() {
    return store.data
  }
  function update(data: T) {
    listeners.emit(store.data = data)
  }
  function subscribe(listener: (data: T) => void) {
    return listeners.subscribe(listener)
  }
  // function useStore() {
  //   const data = useSyncExternalStore(subscribe, get, get)
  //   return [ data, update ] as [
  //     data: typeof data,
  //     update: typeof update
  //   ]
  // }
  function cleanup() {
    cleanupFn?.(store.data)
    listeners.clear()
  }
  return {
    // useStore,
    update,
    get,
    subscribe,
    cleanup
  }

}


export const AppCacheStoreContext = createContext({} as Record<string, any>)

// untested
export function useCacheStore<T>(key: string, initialData: T) {
  const globalstore = use(AppCacheStoreContext)
  if (!globalstore[ key ]) globalstore[ key ] = createCache<T>(() => initialData)
  const store = globalstore[ key ] as ReturnType<typeof createCache<T>>
  const data = useSyncExternalStore(store.subscribe, store.get, store.get)
  return {
    data,
    update: store.update
  }
}







export function createStore<T>(
  init: () => T,
  cleanupFn?: (data: T) => void
) {
  let content = init()
  const listeners = new Listener<T>()

  function get() {
    return content
  }
  function update(newdata: T) {
    listeners.emit(content = newdata)
  }
  function subscribe(listener: (data: T) => void) {
    return listeners.subscribe(listener)
  }
  function cleanup() {
    cleanupFn?.(content)
    listeners.clear()
  }
  return {
    update,
    get,
    subscribe,
    cleanup,
  }
}
export type Store<T> = ReturnType<typeof createStore<T>>
