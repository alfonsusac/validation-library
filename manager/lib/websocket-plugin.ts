
import type { MaybePromise } from "bun"
import { createCoreWebSocketPlugin } from "./websocket-core"

// A Map of functions that the server are able to
//  emit to the client. (either via direct emit() or broadcast())
type PushMap =
  | { [ evName: string ]: (...args: any) => any }

function pushMap<M extends PushMap>(map: M) {
  return map
}

pushMap({})
pushMap({
  "add"(a: number, b: string) {
    return a + b // will be broadcasted in plugin
  },
  async "add2"(a: string, b: number) {
    return a + b // will be broadcasted in plugin
  },
})


// Creates a emit client that respects the
//  emitMaps, as well as injecting the
//  implementation of the push()
// Cannot be WS because it can either be 
//  ws or server publish, so it needs to
//  be injected by the plugin
type TypedPusher<Map extends PushMap> =
  <N extends keyof Map & string>(
    name: N,
    ...data: Parameters<Map[ N ]>
  ) => void

function typedPusher<Map extends PushMap>(implementation: (N: string, ...data: any[]) => void) {
  return function push<EvName extends keyof Map & string>
    (name: EvName, ...data: Parameters<Map[ EvName ]>) {
    implementation(name, data)
  }
}

// util function to create a typed pusher client, 
//  by injecting the implementation of push()
//  i.e passing rpcs[evName]'s parameter, ws.emit to the implementation
export function emitClient<Map extends PushMap>(
  implementation: (name: string, payload: any) => void,
) {
  return { push<EvName extends keyof Map & string>(name: EvName, ...data: Parameters<Map[ EvName ]>) { implementation(name, data) } }
}

// A WebSocket that also has the ability 
//  to publish data with respect to BroadcastPushMap
type RPCWSClient<Broadcasts extends PushMap> = {
  ws: Bun.ServerWebSocket,
  server: Bun.Server<undefined>,
  broadcast: TypedPusher<Broadcasts>,
  emit: (N: string, data: any) => void
}

// This will be exposed to the user when implementing
//  rpc handlers.
function createRPCWSClient<Broadcasts extends PushMap>(
  ws: Bun.ServerWebSocket,
  server: Bun.Server<undefined>,
  broadcast: TypedPusher<Broadcasts>,
  emit: (N: string, data: any) => void
): RPCWSClient<Broadcasts> {
  return { server, ws, broadcast, emit }
}

type WSPluginServerClient<Broadcasts extends PushMap> = {
  server: Bun.Server<undefined>,
  broadcast: TypedPusher<Broadcasts>
}



type RPCHandler<Broadcasts extends PushMap> =
  (ws: RPCWSClient<Broadcasts>, ...args: any[]) => any

type RPCMap<Broadcasts extends PushMap> =
  | { [ evName: string ]: RPCHandler<Broadcasts> }

type OutputPayload = string | Bun.ArrayBufferView | ArrayBuffer | SharedArrayBuffer

export type PluginSchema = {
  broadcasts: PushMap,
  rpcs: RPCMap<any>
}

// To be passed into createWebSocketController.
// Errors will be caught and logged by the controller,
//  so no need to wrap with try/catch.
function corewsplugin<
  Broadcasts extends PushMap,
  RPCs extends RPCMap<Broadcasts>
>(opts: {
  broadcasts: Broadcasts,
  rpcs: RPCs,
  onServe:
  (server: WSPluginServerClient<Broadcasts>) => MaybePromise<void>,
  onPublish:
  (server: Bun.Server<undefined>, message: OutputPayload) => void,
  decode:
  (message: string | Buffer<ArrayBuffer>) => { name: string, args: any[] },
  encode:
  (eventName: string, data: any) => OutputPayload
}) {
  const plugin = createCoreWebSocketPlugin({
    handleWsMessage: async (message, ws, server) => {
      const decoded = opts.decode(message)
      if (decoded.name in opts.rpcs === false) return "RPC not found"
      const rpcHandler = opts.rpcs[ decoded.name ]
      const rpcWsClient = createRPCWSClient(ws, server,
        (evName, data) => opts.onPublish(server, opts.encode(evName, data)),
        (evName, data) => ws.send(opts.encode(evName, data))
      )
      const result = await rpcHandler(rpcWsClient, ...decoded.args)
      rpcWsClient.ws.send(opts.encode(decoded.name, result))
      return "RPC result sent back to client"
    },
    onServe: async (server) => {
      const wsPluginServerClient: WSPluginServerClient<Broadcasts> = {
        server: server,
        broadcast: typedPusher(
          (evName, data) => opts.onPublish(server,
            opts.encode(evName, opts.broadcasts[ evName ](data))
          ),
        )
      }
      await opts.onServe(wsPluginServerClient)
    },
  })
  return {
    ...plugin,
    $schema: {} as {
      broadcasts: Broadcasts,
      rpcs: RPCs
    }
  }
}

const rpcwsplugin = corewsplugin({
  onPublish: (server, message) => server.publish("global", message),
  onServe: async () => undefined,
  decode: () => 0 as any,
  encode: () => "" as any,
  broadcasts: {
    "add"(a: number, b: string) {
      return a + b // will be broadcasted in plugin
    },
    async "add2"(a: string, b: number) {
      return a + b // will be broadcasted in plugin
    },
    "add3": (a: string, b: number) => a + b,
    "add4": (a: string, b: number) => a + b,
    "add5": (a: string, b: number) => a + b,
    "add6": (a: string, b: number) => a + b,
    "add7": (a: string, b: number) => a + b,
    "add8": (a: string, b: number) => a + b,
    "add9": (a: string, b: number) => a + b,
    "add10": (a: string, b: number) => a + b,
    "add11": (a: string, b: number) => a + b,
    "add12": (a: string, b: number) => a + b,
    "add13": (a: string, b: number) => a + b,
  },
  rpcs: {
    "getTime"(ws) {
      ws.broadcast("add11", "hello", 123)
      const client = emitClient<{
        "add12": (a: string, b: number) => string
      }>(ws.emit)

      client.push("add12", "world", 456)

      return new Date().toISOString()
    }
  }
})





// Default implementation of the WebSocket plugin.
export function wsplugin<
  RPCs extends RPCMap<Broadcasts>, // Can't default to {}, will fail to infer TBroadcasts.
  Broadcasts extends PushMap = {}, // Can default to {} since it is used in other types
>(opts: {
  broadcasts?: Broadcasts,
  rpcs?: RPCs,
  onServe?:
  (server: WSPluginServerClient<Broadcasts>) => MaybePromise<void>,

  // Optional parameters
  onPublish?:
  (server: Bun.Server<undefined>, message: OutputPayload) => void,
  decode?:
  (message: string | Buffer<ArrayBuffer>) => { name: string, args: any[] },
  encode?:
  (eventName: string, data: any) => OutputPayload
}) {
  return corewsplugin({
    broadcasts: opts.broadcasts ?? {} as Broadcasts,
    rpcs: opts.rpcs ?? {} as RPCs,
    onServe: opts.onServe ?? (async () => { }),
    onPublish: opts.onPublish ??
      ((server, message) => server.publish("global", message)),
    decode: opts.decode ??
      ((message) => {
        const decoded = JSON.parse(message.toString())
        if (typeof decoded !== "object" || decoded === null || typeof decoded.name !== "string" || !Array.isArray(decoded.args))
          throw new Error(`Invalid message format: ${ message }, decoded: ${ decoded }`)
        return decoded
      }),
    encode: opts.encode ??
      ((eventName, data) =>
        JSON.stringify({ name: eventName, data: data })
      )
  })
}


// testsswe
// Case of no broadcast
wsplugin({
  rpcs: {
    a: async (ws) => {

    }
  },
  onServe: async (server) => {
    // @ts-expect-error can't broadcast if no broadcast map...
    server.broadcast("")
  },
})

// Case of yes broadcast
wsplugin({
  broadcasts: {
    time: () => new Date(Date.now())
  },
  rpcs: {
    a: async (ws) => {

    }
  }
})


