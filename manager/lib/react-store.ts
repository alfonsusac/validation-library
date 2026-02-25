import { Listener } from "./util-listener"


export function createStore<T>(init: T) {
  let store: T = init
  const listeners = new Listener<T>()
  return {
    update(data: T) {
      store = data
      listeners.emit(data)
    },
    getSnapshot() {
      return store
    },
    subscribe(listener: (data: T) => void) {
      const rem = listeners.add(listener)
      return () => rem()
    },
    clear() {
      listeners.clear()
    }
  }
}