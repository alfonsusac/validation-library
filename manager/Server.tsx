import { ServerEventPublisher } from "./lib/ws2-core"
import { appServer } from "./lib/server"
import { onProcessExit } from "./lib/server-cleanup"
import { PackageJson } from "./features/package-json"



export const startManager = async () => {
  const publisher = ServerEventPublisher("global",
    (payload) => { console.log("Publishing global event:", [ payload.evName, payload.data ]) }
  )
  const packageJson = PackageJson(publisher.publish)
  // const pinger = Pinger(publisher.publish)
  const server = await appServer({
    publisher,
    methods: {
      "getTime": () => new Date().toISOString(),
      "getRandomNumber": (prefix: string, suffix: number) => prefix + Math.random() + suffix,
      ...packageJson.methods
    },
    events: {
      ...packageJson.events,
      // ...pinger.events
    },
  })
  publisher.initialize(server.server)
  onProcessExit(() => {
    server.server.stop()
    packageJson.cleanup()
    // pinger.cleanup()
  })
  return server
}

export type ManagerServer = Awaited<ReturnType<typeof startManager>>
export type ManagerServerEvents = ManagerServer[ '_$serverEvents' ]
export type ManagerServerMethods = ManagerServer[ '_$rpcMethods' ]