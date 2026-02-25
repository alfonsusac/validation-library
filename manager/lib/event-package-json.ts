import { createWsSchema } from './socket-core'
import { createTextFileWatcher } from './core-file-watcher'

export type PackageJson = Exclude<ReturnType<typeof parsePackageJSON>, string>

export function parsePackageJSON(input: unknown) {
  if (typeof input !== "object" || input === null)
    return "not an object"
  if ("name" in input === false)
    return "package.name missing"

  // Todo : Validation
  // - check with -> https://github.com/sindresorhus/type-fest/blob/main/source/package-json.d.ts
  // - check with -> https://docs.npmjs.com/cli/v11/configuring-npm/package-json

  return input as {
    name: string,
    version: string,
    dependencies?: Record<string, string>,
    devDependencies?: Record<string, string>,
  }
}
export async function readPackageJson() {
  return (await import('../../package.json')).default as unknown as PackageJson
}
export async function udpatePackageJson(newData: PackageJson) {
  Bun.write('./package.json', JSON.stringify(newData, null, 2))
}


export type PackageJSONEventMap = typeof packageJson.ws

export const packageJson = {

  file: createTextFileWatcher('./package.json', {
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
  ws: createWsSchema({
    async getPackageJSON(ws) {
      const packageJsonData = await packageJson.file.read()
      ws.emit("getPackageJSON", packageJsonData)
      return packageJsonData
    },
    async updatePackageJSON(ws, newData) {
      console.log("Updating package.json with data from client!!", newData)
      await udpatePackageJson(newData)
    }
  }),

  publishOnChange(server: Bun.Server<undefined>) {
    packageJson.file.onChange(content => {
      packageJson.ws.publishAll(server, "getPackageJSON", content)
    })
  },

  handleWsMessage(
    ws: Bun.ServerWebSocket,
    message: string | Buffer<ArrayBuffer>,
  ) {
    packageJson.ws.handleMessage(ws, message)
  }
}

