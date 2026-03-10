import { EventListener, Listener } from "./util-listener"
import type { ServerEventPayload } from "./ws-core"
import { getErrorMessage } from "./util-get-error-message"
import { newStore, useQuery, type Store } from "./react-store"
import type { MaybePromise } from "bun"

// Strategy:
// - instantiate ws client in App, pass it down via context
// - ws client has subscribe func that listens to serverEvent broadcast
// - ws client automatically parses data onMessage
// - useWS -> read from context, return subscribe to eventObject func, return ws client instance


export function createAppClient<
  E extends Record<string, any>
>(wsurl: string) {

  // ws event part
  const id = Math.random().toString(16).slice(2, 6)
  // console.log("Creating AppClient with wsurl:", wsurl, `[${ id }]`)
  const ws = new WebSocket(wsurl)
  const event = new EventListener<{ [ K in keyof E ]: [ data: E[ K ] ] }>()
  const wsevent = newStore(() => ws.readyState)

  ws.onopen = () => {
    // console.log("ws) connected")
    wsevent.update(ws.readyState)
  }
  ws.onclose = () => {
    // console.log("ws) closed")
    wsevent.update(ws.readyState)
  }
  ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data) as ServerEventPayload
      event.emit(data.event, data.data)
    } catch (error) {
      console.error("ws) failed to parse message", getErrorMessage(error))
    }
  }

  function cleanup() {
    ws.close()
    ws.onopen = null
    ws.onclose = null
    ws.onmessage = null
    event.clear()
    wsevent.cleanup()
    Object.entries(storeMap).forEach(([ key, store ]) => {
      store.store.cleanup()
      delete storeMap[ key ]
    })
  }
  function subscribe<K extends keyof E>(eventName: K, handler: (data: E[ K ]) => void) {
    const cleanup = event.subscribe(eventName, handler)
    return () => {
      // console.log("Clearing", event.length(eventName), "listeners to event", eventName)
      cleanup()
    }
  }
  function length<K extends keyof E>(eventName: K) {
    return event.length(eventName)
  }

  // store part
  const storeMap = {} as Record<string, {
    store: Store<any>,
    // initialPromise: Promise<any> | null
  }>
  function getStore(key: string) {
    return storeMap[ key ]
  }
  function createOrRetrieveStore<T>(key: string, initialData: () => MaybePromise<T>) {
    if (getStore(key)) {
      console.warn(`store with key ${ key } already exists. Returning existing store.`)
      return getStore(key).store as Store<T>
    }
    const newstore = newStore<T | undefined>(() => undefined)
    storeMap[ key ] = {
      store: newstore,
    }
    const _ = (async () => {
      try {
        const data = await initialData()
        newstore.update(data)
      } catch (error) {
        console.error(`Failed to get initial data for store ${ key }:`, getErrorMessage(error))
      }
    })()

    return storeMap[ key ].store as Store<T | undefined>
  }

  return {
    // ws event part
    cleanup, subscribe, instance: ws, length, wsevent,
    // store part
    storeMap, getStore, createOrRetrieveStore
  }
}

export type AppClient<E extends Record<string, any>> = ReturnType<typeof createAppClient<E>>

