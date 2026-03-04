import { useEffect, useMemo, useSyncExternalStore } from "react"
import type { PackageJson } from "./package-json"
import { call, useAppClient, type ManagerAppClient } from "../app/use-app-client"


const packageJsonStoreKey = "packageJSON"

export function usePackageJson() {
  const client = useAppClient()
  const store = useMemo(() => client.createOrRetrieveStore<PackageJson>(packageJsonStoreKey, undefined), [])
  const packageJson = useSyncExternalStore(store.subscribe, store.get, store.get)

  async function update(payload: Partial<PackageJson>) {
    const prev = store.get()
    if (!prev) return console.log("Update failed")
    call("updatePackageJSON", { ...prev, ...payload })
  }

  return { packageJson, updatePackageJson: update }
}



export function useListenPackageJson(ws: ManagerAppClient) {
  const store = ws.createOrRetrieveStore<PackageJson>(packageJsonStoreKey, undefined)
  useEffect(() => {
    call("getPackageJSON").then(data => { store.update(data) })
    const cleanup = ws.subscribe("package-json-updated", data => { store.update(data) })
    return () => cleanup()
  }, [])
}