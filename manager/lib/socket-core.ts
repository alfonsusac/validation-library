import type { WSEventMap } from "./socket-types"

export function encodeClientPayload(name: string, params: any[]) {
  return JSON.stringify({ type: name, params: params })
}
export function decodeClientPayload(message: string): { type: string, params: any[] } {
  return JSON.parse(message)
}

export function encodeServerPayload(name: string, data: any) {
  return JSON.stringify({ type: name, data: data })
}
export function decodeServerPayload(message: string): { type: string, data: any } {
  return JSON.parse(message)
}


type GetServerEventHandlerMap<Evs extends WSEventMap> = {
  [ N in keyof Evs ]: (...args: Parameters<Evs[ N ]>) => void
}

export function createClientWS<Evs extends WSEventMap>(_socket?: WebSocket) {
  const socket = _socket ?? new WebSocket("ws://localhost:3000/ws")

  function emit<
    N extends keyof Evs & string
  >(name: N, ...args: Parameters<Evs[ N ]>) {
    if (socket.readyState !== WebSocket.OPEN)
      socket.addEventListener("open", () => socket.send(encodeClientPayload(name, args)), { once: true })
    else
      socket.send(encodeClientPayload(name, args))
  }

  function register(opts: {
    onOpen?: () => void,
    onClose?: () => void,
    onError?: (error: any) => void
  }) {
    socket.addEventListener("open", () => opts.onOpen?.())
    socket.addEventListener("close", () => opts.onClose?.())
    socket.addEventListener("error", error => opts.onError?.(error))
    return () => socket.close()
  }

  function listenTo<
    N extends keyof Evs
  >(
    name: N,
    callback: (payload: ReturnType<Evs[ N ]>) => void
  ) {
    const handler = (event: Bun.BunMessageEvent) => {
      const payload = decodeServerPayload(event.data)
      if (payload.type === name)
        callback(payload.data as ReturnType<Evs[ N ]>)
    }
    socket.addEventListener("message", handler)
    return () => socket.removeEventListener("message", handler)
  }

  return {
    emit,
    listenTo,
    register
  }

}


function wsEmitter<TPayloadMap extends WSEventMap>(ws: Bun.ServerWebSocket) {

  function emit<
    N extends keyof TPayloadMap & string
  >(name: N, data: ReturnType<TPayloadMap[ N ]>) {
    ws.send(encodeServerPayload(name, data))
  }

  return {
    emit
  }

}

// export function createServerWS<TPayloadMap extends WSEventMap>(ws: Bun.ServerWebSocket) {

//   function emit<
//     N extends keyof TPayloadMap & string
//   >(name: N, data: ReturnType<TPayloadMap[ N ]>) {
//     ws.send(encodeServerPayload(name, data))
//   }

//   function handleMessage(message: string | Buffer<ArrayBuffer>, handlers: GetServerEventHandlerMap<TPayloadMap>) {
//     if (typeof message !== "string") {
//       console.log("[socket-core] Received non-string message, ignoring.")
//       return "invalid message format"
//     }
//     const clientPayload = decodeClientPayload(message)
//     const name = clientPayload.type as keyof TPayloadMap
//     const args = clientPayload.params as Parameters<TPayloadMap[ typeof name ]>
//     if (clientPayload.type in handlers === false || typeof handlers[ name ] !== "function") {
//       console.log("[socket-core] No handler for client payload type:", clientPayload.type)
//       return "event type not found"
//     }
//     handlers[ name ](...args)
//   }

//   return {
//     emit,
//     handleMessage
//   }

// }


export function createWsSchema<TEventHandlerMap extends {
  [ EventName: string ]: (ws: ReturnType<typeof wsEmitter>, ...args: any[]) => void,
}>(evHandlerMap: TEventHandlerMap) {

  function handleMessage(
    ws: Bun.ServerWebSocket,
    message: string | Buffer<ArrayBuffer>
  ) {
    if (typeof message !== "string") {
      console.log("[socket-core] Received non-string message, ignoring.")
      return "invalid message format"
    }
    const clientPayload = decodeClientPayload(message)
    if (clientPayload.type in evHandlerMap === false) return "event type not found"
    const name = clientPayload.type as keyof TEventHandlerMap
    const args = clientPayload.params as Parameters<TEventHandlerMap[ typeof name ]> ?? []
    if (typeof evHandlerMap[ name ] !== "function") return "event type not found"
    evHandlerMap[ name ](wsEmitter(ws), ...args)
  }

  function publishAll<
    EvName extends keyof TEventHandlerMap & string
  >(
    server: Bun.Server<undefined>,
    event_name: EvName,
    payload: Awaited<ReturnType<TEventHandlerMap[ EvName ]>>
  ) {
    server.publish("global", encodeServerPayload(event_name, payload))
  }


  return {
    handleMessage,
    publishAll,
    $clientEvMap: {} as {
      [ N in keyof TEventHandlerMap ]: (...args: ExcludeFirst<Parameters<TEventHandlerMap[ N ]>>) => Awaited<ReturnType<TEventHandlerMap[ N ]>>
    }
  }

}

type ExcludeFirst<T extends any[]> = T extends [ any, ...infer Rest ] ? Rest : never