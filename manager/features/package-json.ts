import { jsonfetch } from "../lib/fetch"
import type { DataCacheType } from "../lib/fetch-cache"
import { JSONFileController } from "../lib/file-controller"
import { EventEmitter, type EventPublisherFn, RPCMethods } from "../lib/ws2-core"

export type PackageJson = {
  name: string,
  version: string,
  description?: string,
  keywords?: string[],
  homepage?: string,
  bugs?: {
    url?: string,
    email?: string,
  } | string,
  dependencies?: Record<string, string>,
  devDependencies?: Record<string, string>,
  license?: string,
}



export async function PackageJson(
  publisherFn: EventPublisherFn,
  dataCache: DataCacheType
) {
  const file = JSONFileController<PackageJson>('./package.json')
  const publisher = EventEmitter<{
    'package-json-updated': PackageJson
  }>(publisherFn)

  const methods = RPCMethods({
    "getPackageJSON": async () => { return file.get() },
    "updatePackageJSON": async (newData: PackageJson) => { await file.set(newData) },
    "getValidLicenses": getValidLicenses(dataCache),
  })

  await file.initialize()
  file.subscribe(content => publisher.publish("package-json-updated", content))

  return {
    methods: methods,
    events: publisher.events,
    cleanup() { file.cleanup() }
  }
}





function getValidLicenses(dataCache: DataCacheType) {
  return async () => {
    return dataCache.cache("spdx_licenses", async () => {
      const res = await jsonfetch<{
        licenses: { licenseId: string, isOsiApproved: boolean, name: string }[]
      }>("https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/licenses.json")
      if (res.status === "fetch error") {
        console.log("error fetching licenses:", res.errorMessage)
        return { status: "fetch error" as const }
      }
      if (res.status === "parse error") {
        console.log("error parsing licenses json:", res.errorCode, res.errorMessage, res.readonlyRes)
        return { status: "parse error" as const }
      }
      return {
        status: "ok" as const, licenses: res.json.licenses.map(l => ({ id: l.licenseId, name: l.name, osiApproved: l.isOsiApproved }))
      }
    })
  }
}

