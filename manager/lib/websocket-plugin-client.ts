import { Listener } from "./util-listener"
import { WebSocketPayload } from "./websocket-payload"
import type { PluginSchema } from "./websocket-plugin"


// For References: 
// export type PluginSchema = {
//   broadcasts: PushMap,
//   rpcs: RPCMap<any>
// }


// Responsibility to implement is left to the client,
//  as the client may have different ways to handle the
//  incoming messages.

export type GetEmitName<S extends PluginSchema> = keyof S[ 'rpcs' ] & string
export type GetEmitArgs<S extends PluginSchema, N extends GetEmitName<S>> = Parameters<S[ 'rpcs' ][ N ]>

export type GetMessageHandlers<S extends PluginSchema> = {
  [ N in keyof S[ 'broadcasts' ] & string ]: (data: ReturnType<S[ 'broadcasts' ][ N ]>) => void
} & {
  [ N in keyof S[ 'rpcs' ] & string ]: (data: ReturnType<S[ 'rpcs' ][ N ]>) => void
}

// need a helper to convert PluginSchema into message handler type and emits
export function createWsPluginClient<
  S extends PluginSchema
>(opts: {
  send: (message: string) => void,
  getReadyState: () => number,
  subscribeOnOpen: (handler: () => void) => () => void,
  subscribeOnData: (name: string, handler: (data: any) => void) => () => void, // assumes data is already parsed, and is the payload sent by server
}) {
  function emitOnceOpen<N extends keyof S[ 'rpcs' ] & string>(
    evName: N,
    ...args: Parameters<S[ 'rpcs' ][ N ]>
  ) {
    const readyState = opts.getReadyState()
    const send = () => opts.send(WebSocketPayload.encodeToServer({ type: evName, args: args }))
    if (readyState === WebSocket.CLOSED)
      throw new Error(`[clientWsPlugin] WebSocket is closed, cannot emit event ${ evName }`)
    if (readyState === WebSocket.CONNECTING)
      return opts.subscribeOnOpen(() => send())
    if (readyState === WebSocket.OPEN)
      return send()
  }

  type ServerEventNames = (keyof S[ 'broadcasts' ] | keyof S[ 'rpcs' ]) & string
  type ServerEventPayload<N extends ServerEventNames> = N extends keyof S[ 'broadcasts' ] & string
    ? Awaited<ReturnType<S[ 'broadcasts' ][ N ]>>
    : N extends keyof S[ 'rpcs' ] & string
      ? Awaited<ReturnType<S[ 'rpcs' ][ N ]>>
      : never

  function subscribe<N extends ServerEventNames>(
    evName: N,
    handler: (data: ServerEventPayload<N>) => void
  ) {
    return opts.subscribeOnData(evName, handler)
  }

  return {
    emitOnceOpen,
    subscribe
  }

}


// export function createWsPluginClient(
//   ws: WebSocket,
// ) {
//   const listener = new Listener<[ name: string, payload: any ]>()

//   const onMessage = (ev: MessageEvent<any>) => {
//     const data = WebSocketPayload.decodeFromServer(ev.data)
//     listener.emit([ data.type, data.data ])
//   }
//   ws.addEventListener("message", onMessage)
//   function cleanup() {
//     ws.close()
//     ws.removeEventListener("message", onMessage)
//     listener.clear()
//   }

//   function subscribe(type: string, handler: (payload: any) => void) {
//     return listener.subscribe(([ name, payload ]) => {
//       if (name === type) handler(payload)
//     })
//   }

//   return {
//     cleanup,
//     subscribe
//   }

// }


// export function clientWsPlugin<S extends PluginSchema>(
//   ws: WebSocket
// ) {

//   // What the client allowed to emit with
//   //  respect to the plugin schema.
//   function emit<N extends keyof S[ 'rpcs' ] & string>(evName: N, ...args: Parameters<S[ 'rpcs' ][ N ]>) {
//     const payload = {
//       type: evName,
//       data: args,
//     }
//     const send = () => ws.send(JSON.stringify(payload))
//     if (ws.readyState === WebSocket.CLOSED)
//       throw new Error(`[clientWsPlugin] WebSocket is closed, cannot emit event ${ evName }`)
//     if (ws.readyState === WebSocket.CONNECTING)
//       return ws.addEventListener("open", () => ws.send(JSON.stringify(payload)), { once: true })
//     if (ws.readyState === WebSocket.OPEN)
//       return ws.send(JSON.stringify(payload))
//   }

//   // What the client allowed to listen with
//   function handleMessage() {

//   }

// }