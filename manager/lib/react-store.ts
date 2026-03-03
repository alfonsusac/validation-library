import { useSyncExternalStore } from "react"
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
  function useStore() {
    const data = useSyncExternalStore(subscribe, get, get)
    return [ data, update ] as [
      data: typeof data,
      update: typeof update
    ]
  }
  function cleanup() {
    cleanupFn?.(store.data)
    listeners.clear()
  }
  return {
    useStore,
    update,
    get,
    subscribe,
    cleanup
  }

}