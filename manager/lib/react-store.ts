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
  function cleanup() {
    cleanupFn?.(store.data)
    listeners.clear()
  }
  return {
    update,
    get,
    subscribe,
    cleanup
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
  return { update, get, subscribe, cleanup, }
}
export type Store<T> = ReturnType<typeof createStore<T>>
