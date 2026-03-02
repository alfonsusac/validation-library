import { EventListener } from "./util-listener"

const VERBOSE = true
const log = (...args: any[]) => VERBOSE && console.log("[ws]", ...args)
console.log("[ws] module loaded")

// HMR safe WebSocket wrapper with 
//  event listener and cleanup.
export function createWebSocket(url: string) {
  const ws = new WebSocket(url)

  type MessageWebsocketEvent = { readonly data: any, readonly origin: string }
  const event = new EventListener<{
    message: [ MessageWebsocketEvent ]
  }>

  ws.onopen = () => {
    log("[ws] opened")
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

  const cleanup = () => {
    ws.close()
    ws.onopen = null
    ws.onmessage = null
    ws.onclose = null
    event.clear()
  }

  const subscribeMessage =
    (handler:
      (e: MessageWebsocketEvent) => void
    ) => {
      return event.subscribe("message", handler)
    }

  return {
    instance: ws,
    cleanup,
    subscribeMessage
  }
}





// let ws: WebSocket | null = null

// // call this whomever is initiating / accepting
// export function wsinit() {
//   ws = new WebSocket("ws://localhost:3000/ws")
//   ws.onopen = () => {
//     console.log("ws opened")
//   }
//   ws.onmessage = (e) => {
//     console.log("ws message", e.data)
//   }
//   ws.onclose = () => {
//     console.log("ws close")
//   }
// }


// // call this whomever is calling .dispose()
// export function wsCleanup() {
//   ws.close()
//   ws.onopen = null
//   ws.onmessage = null
//   ws.onclose = null
// }

// import.meta.hot.dispose(() => {
//   console.log("is this still run?")
// })




// const store = import.meta.hot.data.store ??= {}

// store.ws ??= new WebSocket("ws://localhost:3000/ws")
// export const ws = store.ws as WebSocket

// // import.meta.hot.accept()
// import.meta.hot.dispose(() => {
//   store.ws.close()
//   store.ws = undefined
// })


