import { createContext, use } from "react"
import { EventListener } from "./util-listener"

const VERBOSE = false
const log = (...args: any[]) => VERBOSE && console.log("[ws]", ...args)
console.log("[ws] module loaded")

// HMR safe WebSocket wrapper with 
//  event listener and cleanup.
export function createWebSocketCore(url: string) {
  const ws = new WebSocket(url)

  type WebSocketEventMap = {
    message: [ { readonly data: any, readonly origin: string } ],
    open: [],
  }
  const event = new EventListener<WebSocketEventMap>()

  ws.onopen = () => {
    log("[ws] opened")
    event.emit("open")
  }
  ws.onmessage = e => {
    log(`[ws] message ${ e.data }`)
    event.emit("message", e)
  }
  ws.onclose = () => {
    log("[ws] closed")
  }
  ws.onerror = () => {
    log("[ws] error")
  }

  function cleanup() {
    ws.close()
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    event.clear()
  }

  function subscribeMessage(handler:
    (e: WebSocketEventMap[ 'message' ][ 0 ]) => void
  ) {
    return event.subscribe("message", handler)
  }

  function onOpen(handler: () => void, opts?: { once?: boolean }) {
    return event.subscribe("open", handler, opts)
  }

  const on = event.subscribe.bind(event)
  const length = event.length.bind(event)
  const send = ws.send.bind(ws)

  const id = Math.random().toString(16).slice(2, 6)

  return {
    id,
    instance: ws,
    send,
    cleanup,
    subscribeMessage,
    onOpen,
    length,
    on,
  }
}

export type WebSocketClientCore = ReturnType<typeof createWebSocketCore>




const WebSocketContext = createContext<WebSocketClientCore | null>(null)
export { WebSocketContext }