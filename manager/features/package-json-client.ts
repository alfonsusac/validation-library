import { createAppStore } from "../app/__app-store"
import type { WebSocketClientCore } from "../lib/websocket-client-core"
import { createCache } from "../lib/react-store"
// import type { PackageJson, PackageJsonEventSchema } from "../lib/package-json"
import { clientWs } from "../lib/socket-core"
import { createWsPluginClient } from "../lib/websocket-plugin-client"
import type { PackageJson, PackageJsonEventSchema } from "./package-json"
import type { AppSocket } from "../app/app-ws"
import { createContext, use, useSyncExternalStore } from "react"

// PackageJsonEventSchema
// 
export function createPackageJsonClient(ws: AppSocket) {

  const store = createCache<PackageJson | undefined>(() => undefined)
  // const appWs = createWsPluginClient()
  const wsClient = createWsPluginClient<PackageJsonEventSchema>({
    send: ws.sendStr,
    getReadyState: () => ws.readyState,
    subscribeOnOpen: ws.instance.onOpen,
    subscribeOnData: ws.subscribe,
  })

  // attaches event listeners and update store
  wsClient.subscribe("getPackageJSON", (data) => {
    store.update(data)
  })
  wsClient.subscribe("updated:packageJSON", (data) => store.update(data))
  // request initial data
  wsClient.emitOnceOpen("getPackageJSON")

  return {
    getter: store.get,
    subscribe: store.subscribe
  }

}

export const PackageJsonStoreContext = createContext<ReturnType<typeof createPackageJsonClient> | undefined>(undefined)

export function usePackageJson() {
  const store = use(PackageJsonStoreContext)
  if (store === undefined) throw new Error("usePackageJson must be used within a PackageJsonStoreContext.Provider")
  return useSyncExternalStore(store.subscribe, store.getter)
}

// export function createPackageJsonClient() {

//   const client = clientWs<PackageJsonEventSchema>()

//   return createAppStore<PackageJson>("packageJSON", {
//     requestData(ws) {
//       client.emit(ws, "getPackageJSON")
//     },
//     requestUpdate(ws, data) {
//       client.emit(ws, "updatePackageJSON", data)
//     },
//     onMessage(event) {
//       const data = JSON.parse(event.data)
//       if (data.type === "getPackageJSON") {
//         return data.data as PackageJson
//       }
//       return undefined
//     }
//   })

// }