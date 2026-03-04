import { createContext } from "react"
import { EventListener } from "../lib/util-listener"
import { createWebSocketCore } from "../lib/websocket-client-core"

export function createAppSocket(url: string) {
  const ws = createWebSocketCore(url)
  const event = new EventListener<Record<string, [ data: any ]>>()

  ws.subscribeMessage((ev: { data: any }) => {
    const data = JSON.parse(ev.data)
    event.emit(data.type, data.data)
  })

  function subscribe(type: string, handler: (data: any[]) => void) {
    return event.subscribe(type, handler)
  }
  function cleanup() {
    ws.cleanup()
  }
  function sendStr(message: string) {
    ws.send(message)
  }

  return {
    instance: ws,
    readyState: ws.instance.readyState,
    subscribe,
    onOpen: ws.onOpen,
    cleanup,
    sendStr
  }
}

export type AppSocket = ReturnType<typeof createAppSocket>

export const AppSocketContext = createContext<ReturnType<typeof createAppSocket> | null>(null)
  


