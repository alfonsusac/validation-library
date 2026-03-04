import { nanoid } from "nanoid"
import { wsplugin } from "../lib/websocket-plugin"
import { EventEmitter, type EventPublisherFn } from "../lib/ws2-core"

// export const pinger = wsplugin({
//   name: "pinger",
//   broadcasts: {
//     "ping": () => "ping " + nanoid(3)
//   },
//   onServe(server) {
//     setInterval(() => {
//       server.broadcast("ping")
//     }, 1000)
//   },
// })

export function Pinger(
  publishFn: EventPublisherFn
) {
  const publisher = EventEmitter<{
    "ping": [ string ],
  }>(publishFn)
  let intervalId: NodeJS.Timeout = null as any
  intervalId = setInterval(() => {
    publisher.publish("ping", "ping " + nanoid(3))
  }, 1000)
  return {
    events: publisher.events,
    cleanup() { clearInterval(intervalId) }
  }
}