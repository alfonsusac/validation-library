import { appStore } from "../AppState"
import type { PackageJson, PackageJsonEventSchema } from "./package-json"
import { clientWs } from "./socket-core"

export function createPackageJsonClient() {

  const client = clientWs<PackageJsonEventSchema>()

  return appStore<PackageJson>("packageJSON", {
    requestData(ws) {
      client.emit(ws, "getPackageJSON")
    },
    requestUpdate(ws, data) {
      client.emit(ws, "updatePackageJSON", data)
    },
    onMessage(event) {
      const data = JSON.parse(event.data)
      if (data.type === "getPackageJSON") {
        return data.data as PackageJson
      }
      return undefined
    }
  })

}