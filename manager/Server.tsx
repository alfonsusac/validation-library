import { ServerEventPublisher } from "./lib/ws2-core"
import { appServer } from "./lib/server"
import { onProcessExit } from "./lib/server-cleanup"
import { PackageJson } from "./features/package-json"
import { UserSettings } from "./features/user-settings"
import { color } from "bun"
import { Pinger } from "./features/pinger"

export function log(...args: any[]) {
  console.log(`${ color("darkgreen", "ansi") }server\x1b[0m`, ...args)
}

export const startManager = async () => {
  const publisher = ServerEventPublisher("global",
    // (payload) => { log("Publishing global event:", [ payload.evName ]) }
  )
  const packageJson = PackageJson(publisher.publish)
  const userSettings = UserSettings(publisher.publish)
  const pinger = Pinger(publisher.publish)
  const server = await appServer({
    publisher,
    methods: {
      "getTime": () => new Date().toISOString(),
      "getRandomNumber": (prefix: string, suffix: number) => prefix + Math.random() + suffix,
      ...packageJson.methods,
      ...userSettings.methods
    },
    events: {
      ...packageJson.events,
      ...userSettings.events,
      ...pinger.events
    },
    logger: log
  })
  publisher.initialize(server.server)
  onProcessExit(() => {
    server.server.stop()
    packageJson.cleanup()
    userSettings.cleanup()
    pinger.cleanup()
  })

  return server
}

export type ManagerServer = Awaited<ReturnType<typeof startManager>>
export type ManagerServerEvents = ManagerServer[ '_$serverEvents' ]
export type ManagerServerMethods = ManagerServer[ '_$rpcMethods' ]