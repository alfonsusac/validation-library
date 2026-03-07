import { jfetch } from "../lib/fetch"
import { WatchJsonFile } from "../lib/file-controller"
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



export function PackageJson(
  publisherFn: EventPublisherFn
) {
  const file = WatchJsonFile<PackageJson>('./package.json')
  const publisher = EventEmitter<{
    'package-json-updated': PackageJson
  }>(publisherFn)

  const methods = RPCMethods({
    "getPackageJSON": async () => { return file.get() },
    "updatePackageJSON": async (newData: PackageJson) => { await file.set(newData) },
    "getValidLicenses": async () => {
      const res = await jfetch("https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/licenses.json")
      if (res.status === "fetch error") {
        console.log("error fetching licenses:", res.message)
        return { status: "fetch error" as const }
      }
      if (res.json.status === "parse error") {
        console.log("error parsing licenses json:", res.json.message)
        return { status: "parse error" as const }
      }
      const json = res.json.jsondata as { licenses: { licenseId: string, isOsiApproved: boolean, name: string }[] }
      return { status: "ok" as const, licenses: json.licenses.map(l => ({ id: l.licenseId, name: l.name, osiApproved: l.isOsiApproved })) }
    }
  })

  file.subscribe(content => publisher.publish("package-json-updated", content))
  file.initialize()

  return {
    methods: methods,
    events: publisher.events,
    cleanup() { file.cleanup() }
  }
}




