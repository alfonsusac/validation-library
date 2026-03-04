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
    "updatePackageJSON": async (newData: PackageJson) => { await file.set(newData) }
  })

  file.subscribe(content => publisher.publish("package-json-updated", content))
  file.initialize()

  return ({
    methods: methods,
    events: publisher.events,
    cleanup() { file.cleanup() }
  })
}




