import { serverWs } from '../lib/socket-core'
import { createTextFileWatcher } from '../lib/core-file-watcher'
import { wsplugin } from '../lib/websocket-plugin'

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

// 
export function parsePackageJSON(input: unknown) {
  if (typeof input !== "object" || input === null)
    return "not an object"
  if ("name" in input === false)
    return "package.name missing"
  // Todo : Validation
  // - check with -> https://github.com/sindresorhus/type-fest/blob/main/source/package-json.d.ts
  // - check with -> https://docs.npmjs.com/cli/v11/configuring-npm/package-json
  return input as PackageJson
}


export type PackageJsonEventSchema = {
  getPackageJSON: () => PackageJson,
  updatePackageJSON: (newData: PackageJson) => undefined,
}



export const packageJson = {

  fileWatcher: createTextFileWatcher('./package.json', {
    decode: async file => {
      const content = JSON.parse(await file.text())
      const parsed = parsePackageJSON(content)
      if (typeof parsed === "string") throw new Error(`[event-package-json]: Error parsing package.json: ${ content }`)
      return parsed
    },
    encode: async data => {
      return JSON.stringify(data, null, 2)
    }
  }),


  websocketPlugin: wsplugin({
    broadcasts: {
      "updated:packageJSON": (content: PackageJson) => content
    },
    rpcs: {
      getPackageJSON: () => packageJson.fileWatcher.read(),
      updatePackageJSON: (ws, newData: PackageJson) => {
        return Bun.write('./package.json', JSON.stringify(newData, null, 2))
      }
    },
    onServe(server) {
      packageJson.fileWatcher.onChange(content => {
        server.broadcast("updated:packageJSON", content)
      })
    },
  }),



  ws: serverWs<PackageJsonEventSchema>(),

  // realtimeHandler: {

  //   handleWsMessage(
  //     message: string | Buffer<ArrayBuffer>,
  //     ws: Bun.ServerWebSocket,
  //   ) {
  //     packageJson.ws.handleMessage(message, {
  //       'getPackageJSON': async () => {
  //         const packageJsonData = await packageJson.fileWatcher.read()
  //         packageJson.ws.emit(ws, "getPackageJSON", packageJsonData)
  //       },
  //       'updatePackageJSON': async (newData) => {
  //         await Bun.write('./package.json', JSON.stringify(newData, null, 2))
  //       }
  //     })
  //   },

  //   onServe(server) {
  //     packageJson.fileWatcher.onChange(content => {
  //       server.publish("global",
  //         packageJson.ws.getPayload("getPackageJSON", content)
  //       )
  //       // packageJson.ws.publish(server, "global", "getPackageJSON", content)
  //     })
  //   },



  // } satisfies WebSocketPlugin
}







