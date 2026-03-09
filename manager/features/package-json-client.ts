import { useEffect, useSyncExternalStore } from "react"
import { PackageJson } from "./package-json"
import { call, useAppClient, type ManagerAppClient } from "../app/app-client"
import { useQuery } from "../lib/react-store"


// export function usePackageJson() {
//   const client = useAppClient(true)
//   const store = client.createOrRetrieveStore<PackageJson>("packageJSON", async () => {
//     client.subscribe("package-json-updated", (data) => store.update(data))
//     return await call("getPackageJSON")
//   })
//   const packageJson = useSyncExternalStore(
//     store.subscribe,
//     store.get,
//     store.get
//   )
//   async function update(payload: Partial<PackageJson>) {
//     const prev = store.get()
//     if (!prev) return console.log("Update failed")
//     call("updatePackageJSON", { ...prev, ...payload })
//   }

//   return { packageJson, updatePackageJson: update }
// }

export function usePackageJson(): [ PackageJson, (payload: Partial<PackageJson>) => void ]
export function usePackageJson(required: false): [ PackageJson | undefined, (payload: Partial<PackageJson>) => void ]
export function usePackageJson(required: boolean = true) {
  const client = useAppClient()
  const [ packageJson, updatePackageJSON ] = useQuery<undefined | PackageJson>(
    "packageJSON", (clean) => {
      const cleanup = client.subscribe("package-json-updated", data => updatePackageJSON(data))
      clean(cleanup)
      call("getPackageJSON").then(data => updatePackageJSON(data))
      return undefined
    }
  )
  function update(payload: Partial<PackageJson>) {
    if (!packageJson) throw new Error("package.json store is not initialized yet. Can't update.")
    call("updatePackageJSON", { ...packageJson, ...payload })
  }
  if (required && !packageJson) 
    throw new Error("package.json is required but not available yet.")
  return [ packageJson, update ] as const
}


// export function useListenPackageJson(ws: ManagerAppClient) {
//   // const store = ws.createOrRetrieveStore<PackageJson>(packageJsonStoreKey, async () => )
//   // useEffect(() => {
//   //   call("getPackageJSON").then(data => { store.update(data) })
//   //   const cleanup = ws.subscribe("package-json-updated", data => { store.update(data) })
//   //   return () => cleanup()
//   // }, [])
// }