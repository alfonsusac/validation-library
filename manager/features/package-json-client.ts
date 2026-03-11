import { PackageJson } from "./package-json"
import { call, useAppClient } from "../app/app-client"
import { useQuery } from "../lib/react-store"

export function usePackageJson(): [ PackageJson, (payload: Partial<PackageJson>) => void ]
export function usePackageJson(required: false): [ PackageJson | undefined, (payload: Partial<PackageJson>) => void ]
export function usePackageJson(required: boolean = true) {
  const client = useAppClient()
  const [ packageJson, updatePackageJSON ] = useQuery<undefined | PackageJson>(
    "packageJSON", async (clean) => {
      clean(client.subscribe("package-json-updated", data => updatePackageJSON(data)))
      return await call("getPackageJSON")
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
