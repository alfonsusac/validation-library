import { createCache } from "../lib/react-store"
import { createWsPluginClient } from "../lib/websocket-plugin-client"
import { createContext, use, useSyncExternalStore } from "react"
import type { PackageJson, PackageJsonEventSchema } from "./package-json"
import type { AppSocket } from "../app/app-ws"

export function createPackageJsonStore(ws: AppSocket) {

  const store = createCache<PackageJson | undefined>(() => undefined)
  const wsClient = createWsPluginClient<PackageJsonEventSchema>({
    send: ws.sendStr,
    getReadyState: () => ws.instance.instance.readyState,
    subscribeOnOpen: ws.instance.onOpen,
    subscribeOnData: ws.subscribe,
  })

  // attaches event listeners and update store
  wsClient.subscribe("getPackageJSON", (data) => {
    store.update(data)
  })
  wsClient.subscribe("updated:packageJSON", (data) => {
    // console.log("updated:packageJSON", data)
    store.update(data)
  })
  // request initial data
  wsClient.emitOnceOpen("getPackageJSON")

  function update(payload: Partial<PackageJson>) {
    const prev = store.get()
    // console.log(payload, prev)
    if (!prev) return console.log("Update failed")
    wsClient.emitOnceOpen("updatePackageJSON", {
      ...prev,
      ...payload,
    })
  }

  return {
    exists: true,
    update,
    getter: store.get,
    subscribe: store.subscribe,
  }

}

export const PackageJsonStoreContext = createContext({ exists: false } as ReturnType<typeof createPackageJsonStore>)

export function usePackageJson<R extends boolean = false>(required?: R) {
  const store = use(PackageJsonStoreContext)
  if (!store.exists) throw new Error("usePackageJson must be used within a PackageJsonStoreContext.Provider")
  const packageJson = useSyncExternalStore(store.subscribe, store.getter)
  if (packageJson === undefined && required) {
    const err = new Error("PackageJson is required but not available yet.")
    Error.captureStackTrace(err, usePackageJson)
    throw err
  }
  return {
    packageJson: packageJson as (R extends true ? NonNullable<PackageJson> : PackageJson | undefined),
    updatePackageJson: store.update,
  }
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