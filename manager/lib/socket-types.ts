import type { PackageJson } from "../features/package-json"

export type WSEventMap = {
  [ emitName: string ]: (...args: any[]) => any
}

// Client To Server Payload:
// [emitName: string]: (payload from client: any) => expected return from server

export type SocketClientToServerPayload = {
  log: (message: string) => string,
  getPackageJSON: () => PackageJson
}


