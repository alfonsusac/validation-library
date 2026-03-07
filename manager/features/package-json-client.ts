import { useEffect, useSyncExternalStore } from "react"
import type { PackageJson } from "./package-json"
import { call, useAppClient, type ManagerAppClient } from "../app/use-app-client"


export function usePackageJson() {
  const client = useAppClient(true)
  const store = client.createOrRetrieveStore<PackageJson>("packageJSON", async () => {
    client.subscribe("package-json-updated", (data) => store.update(data))
    return await call("getPackageJSON")
  })
  const packageJson = useSyncExternalStore(
    store.subscribe,
    store.get,
    store.get
  )!

  async function update(payload: Partial<PackageJson>) {
    const prev = store.get()
    if (!prev) return console.log("Update failed")
    call("updatePackageJSON", { ...prev, ...payload })
  }

  return { packageJson, updatePackageJson: update }
}



// export function useListenPackageJson(ws: ManagerAppClient) {
//   // const store = ws.createOrRetrieveStore<PackageJson>(packageJsonStoreKey, async () => )
//   // useEffect(() => {
//   //   call("getPackageJSON").then(data => { store.update(data) })
//   //   const cleanup = ws.subscribe("package-json-updated", data => { store.update(data) })
//   //   return () => cleanup()
//   // }, [])
// }