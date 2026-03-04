import { nanoid } from "nanoid"
import { EventEmitter, type EventPublisherFn } from "../lib/ws2-core"

export function Pinger(
  publishFn: EventPublisherFn
) {
  const publisher = EventEmitter<{
    "ping": string,
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