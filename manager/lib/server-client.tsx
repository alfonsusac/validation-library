import { createContext, use, useEffect, useMemo } from "react"
import { createAppSocket } from "../app/app-ws"
import { EventListener, Listener } from "./util-listener"
import type { ServerEventPayload } from "./ws2-core"
import { getErrorMessage } from "./util-get-error-message"
import { createStore, type Store } from "./react-store"

// Strategy:
// - instantiate ws client in App, pass it down via context
// - ws client has subscribe func that listens to serverEvent broadcast
// - ws client automatically parses data onMessage
// - useWS -> read from context, return subscribe to eventObject func, return ws client instance

export function createAppClient<
  E extends Record<string, any>
>(wsurl: string) {

  // ws event part
  const ws = new WebSocket(wsurl)
  const event = new EventListener<{ [ K in keyof E ]: [ data: E[ K ] ] }>()

  ws.onopen = () => console.log("ws) connected")
  ws.onclose = () => console.log("ws) closed")
  ws.onmessage = e => {
    try {
      const data = JSON.parse(e.data) as ServerEventPayload
      // console.log("ws) incoming!", data)
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
    console.log(Object.keys(storeMap).length)
    Object.entries(storeMap).forEach(([ key, store ]) => { // test
      console.log("appClient ) Cleaning Up")
      store.cleanup()
      delete storeMap[ key ]
    })
  }
  function subscribe<K extends keyof E>(eventName: K, handler: (data: E[ K ]) => void) {
    const cleanup = event.subscribe(eventName, handler)
    return () => {
      console.log("Clearing", event.length(eventName), "listeners to event", eventName)
      cleanup()
    }
  }

  // store part
  const storeMap = {} as Record<string, Store<any>>
  function getStore(key: string) {
    return storeMap[ key ]
  }
  function createOrRetrieveStore<T>(key: string, initialData: any) {
    // console.log("Creating Store.", Object.keys(storeMap).length, "existing stores.")
    if (getStore(key)) {
      console.warn(`store with key ${ key } already exists. Returning existing store.`)
      return getStore(key) as Store<T>
    }
    const newstore = createStore(() => initialData)
    storeMap[ key ] = newstore
    return (storeMap[ key ] = createStore(() => initialData)) as Store<T>
  }

  return {
    // ws event part
    cleanup, subscribe, instance: ws, 
    // store part
    storeMap, getStore, createOrRetrieveStore
  }
}

export type AppClient<E extends Record<string, any>> = ReturnType<typeof createAppClient<E>>

