import { createContext, useEffect, useMemo } from "react"
import { createAppSocket } from "../app/app-ws"
import { EventListener, Listener } from "./util-listener"
import type { ServerEventPayload } from "./ws2-core"
import { getErrorMessage } from "./util-get-error-message"

// Strategy:
// - instantiate ws client in App, pass it down via context
// - ws client has subscribe func that listens to serverEvent broadcast
// - ws client automatically parses data onMessage
// - useWS -> read from context, return subscribe to eventObject func, return ws client instance

export function createAppClient<
  ServerEventMap extends Record<string, [ any ]>
>(wsurl: string) {
  const ws = new WebSocket(wsurl)
  const event = new EventListener<ServerEventMap>()
  function cleanup() {
    ws.close()
    ws.onopen = null
    ws.onclose = null
    event.clear()
  }

  ws.onopen = () => {
    console.log("ws) connected")
  }
  ws.onclose = () => {
    console.log("ws) closed")
  }
  ws.onmessage = e => {
    console.log(e.data)
    try {
      const data = JSON.parse(e.data) as ServerEventPayload
      console.log("ws) message", data)
      event.emit(data.event, [ data.data ])
    } catch (error) {
      console.error("ws) failed to parse message", getErrorMessage(error))
    }
  }

  return { cleanup }
}