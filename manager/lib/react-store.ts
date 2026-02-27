import { useSyncExternalStore } from "react"
import { global } from "./lib-global"
import { Listener } from "./util-listener"

console.log("react-store.ts reloaded")

export function createGlobalStore<T>(
  name: string,
  init: () => T,
  cleanup?: (data: T) => void, // not yet tested
) {
  // - Survives hot reloads,
  // - is shared across the app
  // - reacts to changes with listeners 
  const [ getGlobal ] = global(`__app_${ name }_store`, () => {
    return ({
      data: init(),
      listeners: new Listener<T>()
    })
  }, (data) => cleanup?.(data.data))

  function getter() {
    return getGlobal().data
  }
  function update(data: T) {
    const store = getGlobal()
    store.data = data
    store.listeners.emit(data)
    // console.log("Current Listeners: ", store.listeners.length())
  }
  function subscribe(listener: (data: T) => void) {
    getGlobal().listeners.add(listener)
    return () => getGlobal().listeners.remove(listener)
  }

  function useStore() {
    const data = useSyncExternalStore(
      (listener) => {
        // console.log("Subscribing...")
        const cleanup = subscribe(listener)
        return () => {
          // console.log("Unsubscribing...")
          cleanup()
        }
      },
      () => getter(),
    )
    return [ data, update ] as [
      data: T,
      update: (data: T) => void
    ]
  }

  return [ useStore, update, getter, subscribe ] as const
}