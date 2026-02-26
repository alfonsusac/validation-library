import { serverWs } from './socket-core'
import { createTextFileWatcher } from './core-file-watcher'

export type PackageJson = {
  name: string,
  version: string,
  description?: string,
  keywords?: string[],
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

  ws: serverWs<PackageJsonEventSchema>(),

  publishOnChange(server: Bun.Server<undefined>) {
    packageJson.fileWatcher.onChange(content => {
      packageJson.ws.publish(server, "global", "getPackageJSON", content)
    })
  },

  handleWsMessage(
    ws: Bun.ServerWebSocket,
    message: string | Buffer<ArrayBuffer>,
  ) {
    packageJson.ws.handleMessage(message, {
      'getPackageJSON': async () => {
        const packageJsonData = await packageJson.fileWatcher.read()
        packageJson.ws.emit(ws, "getPackageJSON", packageJsonData)
      },
      'updatePackageJSON': async (newData) => {
        await Bun.write('./package.json', JSON.stringify(newData, null, 2))
      }
    })
  }
}





