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

  // function handleMessage


}


function resolveMessage<
  Handlers extends {
    [ key: string ]: (...args: any[]) => void
  }
>(
  message: string | Buffer<ArrayBuffer>,
  handlers: Handlers,
  toJSON: (msg: string) => any,
  getArgs: (parsed: {} & { type: string }) => any[] | string,
) {
  if (typeof message !== "string") {
    return "invalid message: received non-string"
  }
  const parsed = toJSON(message)
  const eventType = parsed.type
  if (eventType == null || typeof eventType !== "string") {
    console.log("[socket-core] Received message without valid 'type' field, ignoring.")
    return "invalid message: missing or invalid 'type' field"
  }
  const args = getArgs(parsed)
  if (typeof args === "string")
    return "invalid args: " + args
  if (eventType in handlers === false || typeof handlers[ eventType ] !== "function")
    return "event type not found"
  handlers[ eventType ](...args)
}











export type EventSchema = {
  // [eventName: string]: (...dataFromClient: any[]) => dataFromServer 
  [ EventName: string ]: (...args: any[]) => void
}

// function wsEmitter<TPayloadMap extends EventSchema>(ws: Bun.ServerWebSocket) {
//   function emit<
//     N extends keyof TPayloadMap & string
//   >(name: N, data: ReturnType<TPayloadMap[ N ]>) {
//     ws.send(encodeServerPayload(name, data))
//   }
//   return {
//     emit
//   }
// }



export function serverWs<TEventSchema extends EventSchema>() {
  function emit<N extends keyof TEventSchema & string>(
    ws: Bun.ServerWebSocket,
    name: N,
    data: Awaited<ReturnType<TEventSchema[ N ]>>
  ) {
    ws.send(encodeServerPayload(name, data))
  }
  function publish<N extends keyof TEventSchema & string>(
    server: Bun.Server<undefined>,
    channel: string,
    name: N,
    data: Awaited<ReturnType<TEventSchema[ N ]>>
  ) {
    server.publish(channel, encodeServerPayload(name, data))
  }
  function handleMessage(
    message: string | Buffer<ArrayBuffer>,
    handlers: {
      [ N in keyof TEventSchema ]: (...args: Parameters<TEventSchema[ N ]>) => void
    }
  ) {
    resolveMessage(message, handlers, JSON.parse, parsed => {
      if ("params" in parsed === false || !Array.isArray(parsed.params)) {
        return "invalid or missing 'params' field"
      }
      return parsed.params
    })
  }
  return {
    emit,
    handleMessage,
    publish,
  }
}


export function clientWs<TEventSchema extends EventSchema>() {

  function emit<N extends keyof TEventSchema & string>(socket: WebSocket, name: N, ...args: Parameters<TEventSchema[ N ]>) {
    if (socket.readyState !== WebSocket.OPEN)
      socket.addEventListener("open", () => socket.send(encodeClientPayload(name, args)), { once: true })
    else
      socket.send(encodeClientPayload(name, args))
  }

  function handleMessage(
    message: MessageEvent,
    handlers: {
      [ N in keyof TEventSchema ]: (data: Awaited<ReturnType<TEventSchema[ N ]>>) => void
    }
  ) {
    resolveMessage(message.data, handlers, JSON.parse, parsed => {
      if ("data" in parsed === false) {
        return "invalid or missing 'params' field"
      }
      return [ parsed.data ]
    })
  }

  return {
    emit,
    handleMessage
  }
}








// export function createWsSchema<TEventHandlerMap extends {
//   [ EventName: string ]: (ws: ReturnType<typeof wsEmitter<TEventHandlerMap>>, ...args: any[]) => void,
// }>(evHandlerMap: TEventHandlerMap) {

//   function handleMessage(
//     ws: Bun.ServerWebSocket,
//     message: string | Buffer<ArrayBuffer>
//   ) {
//     if (typeof message !== "string") {
//       console.log("[socket-core] Received non-string message, ignoring.")
//       return "invalid message format"
//     }
//     const clientPayload = decodeClientPayload(message)
//     if (clientPayload.type in evHandlerMap === false) return "event type not found"
//     const name = clientPayload.type as keyof TEventHandlerMap
//     const args = clientPayload.params as Parameters<TEventHandlerMap[ typeof name ]> ?? []
//     if (typeof evHandlerMap[ name ] !== "function") return "event type not found"
//     evHandlerMap[ name ](wsEmitter(ws), ...args)
//   }

//   function publishAll<
//     EvName extends keyof TEventHandlerMap & string
//   >(
//     server: Bun.Server<undefined>,
//     event_name: EvName,
//     payload: Awaited<ReturnType<TEventHandlerMap[ EvName ]>>
//   ) {
//     server.publish("global", encodeServerPayload(event_name, payload))
//   }


//   return {
//     handleMessage,
//     publishAll,
//     $clientEvMap: {} as {
//       [ N in keyof TEventHandlerMap ]: (...args: ExcludeFirst<Parameters<TEventHandlerMap[ N ]>>) => Awaited<ReturnType<TEventHandlerMap[ N ]>>
//     }
//   }

// }

// type ExcludeFirst<T extends any[]> = T extends [ any, ...infer Rest ] ? Rest : never