import { fileWatcher } from '../lib/ws-file-watcher'
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


export const packageJson = {

  fileWatcher: fileWatcher('./package.json', {
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
    name: "package-json",
    broadcasts: {
      "updated:packageJSON": (content: PackageJson) => content
    },
    rpcs: {
      getPackageJSON: () => packageJson.fileWatcher.read(),
      updatePackageJSON: async (ws, newData: PackageJson) => {
        await packageJson.fileWatcher.write(newData)
      }
    },
    onServe(server) {
      packageJson.fileWatcher.onChange(content => {
        server.broadcast("updated:packageJSON", content)
      })
    },
  }),

}

export type PackageJsonEventSchema = typeof packageJson.websocketPlugin.$schema







