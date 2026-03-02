import { createContext } from "react"
import { EventListener } from "../lib/util-listener"
import { createWebSocketCore } from "../lib/websocket-client-core"
import { createCache } from "../lib/react-store"

export function createAppSocket(url: string) {
  const ws = createWebSocketCore(url)
  const event = new EventListener<Record<string, [ data: any ]>>()

  ws.subscribeMessage((ev: { data: any }) => {
    const data = JSON.parse(ev.data)
    event.emit(data.type, data.data)
  })

  function subscribe(type: string, handler: (data: any[]) => void) {
    return event.subscribe(type, handler)
  }
  function cleanup() {
    ws.cleanup()
  }
  function sendStr(message: string) {
    ws.send(message)
  }

  return {
    instance: ws,
    readyState: ws.instance.readyState,
    subscribe,
    onOpen: ws.onOpen,
    cleanup,
    sendStr
  }
}

export type AppSocket = ReturnType<typeof createAppSocket>

export const AppSocketContext = createContext<ReturnType<typeof createAppSocket> | null>(null)



// WIP
export function createAppStore<T>(opts: {
  ws: AppSocket,
}) {
  const store = createCache<T | undefined>(() => undefined)
  // const wsClient = createWsPluginClient({
  //   send: opts.ws.sendStr,
  //   getReadyState: () => opts.ws.instance.instance.readyState,
  //   subscribeOnOpen: opts.ws.onOpen,
  //   subscribeOnData: opts.ws.subscribe,
  // })
  // opts.ws.instance

  // wsClient.subscribe()

  // function update(payload: Partial<T>) {
  //   const prev = store.get()
  //   if (!prev) return console.log("Update failed")
  //   wsClient.emitOnceOpen("updatePackageJSON", {
  //     ...prev,
  //     ...payload,
  //   })
  // }


  // // attaches event listeners and update store
  // wsClient.subscribe("getPackageJSON", (data) => {
  //   store.update(data)
  // })
  // wsClient.subscribe("updated:packageJSON", (data) => {
  //   store.update(data)
  // })
  // // request initial data
  // wsClient.emitOnceOpen("getPackageJSON")

  // function update(payload: Partial<PackageJson>) {
  //   const prev = store.get()
  //   if (!prev) return console.log("Update failed")
  //   wsClient.emitOnceOpen("updatePackageJSON", {
  //     ...prev,
  //     ...payload,
  //   })
  // }

  // return {
  //   exists: true,
  //   update,
  //   getter: store.get,
  //   subscribe: store.subscribe,
  // }
}