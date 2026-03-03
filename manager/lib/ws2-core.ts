import type { MaybePromise } from "bun"

export function WsHandler(opts: {
  handleMessage?:
  (ws: Bun.ServerWebSocket, message: string | Buffer<ArrayBuffer>) => MaybePromise<void>
  handleString?:
  (ws: Bun.ServerWebSocket, message: string) => MaybePromise<void>
  handleBuffer?:
  (ws: Bun.ServerWebSocket, message: Buffer<ArrayBuffer>) => MaybePromise<void>
  handleJson?:
  (ws: Bun.ServerWebSocket, message: any) => MaybePromise<void>
}) {
  const log = console.log.bind(console, "WsHandler:")

  return {
    handleMessage: async (ws: Bun.ServerWebSocket, message: string | Buffer<ArrayBuffer>) => {
      try {
        await opts.handleMessage?.(ws, message)
        if (typeof message !== "string") {
          log("binary received")
          await opts.handleBuffer?.(ws, message)
        }
        else {
          await opts.handleString?.(ws, message)
          try {
            log("json received")
            const parsed = JSON.parse(message)
            await opts.handleJson?.(ws, parsed)
          } catch (error) {
            log("string received")
            // not a json
          }
        }
      } catch (error) {
        log("error handling message:", error)
        // TODO: test error handling - make sure one bad message doesn't crash 
        // the server or disconnect the client
      }
    }
  }
}





// ----

export function publisher<P>(
  server: Bun.Server<undefined>,
  channel: string,
  encoder: ((data: P) => string | Buffer<ArrayBuffer>)
) {
  function subscribe(ws: Bun.ServerWebSocket) {
    ws.subscribe(channel)
  }
  function unsubscribe(ws: Bun.ServerWebSocket) {
    ws.unsubscribe(channel)
  }
  function publish(message: P) {
    server.publish(channel, encoder(message))
  }
  return { subscribe, unsubscribe, publish }
}

export type publisher = ReturnType<typeof publisher>





// ----

export function EventPublisher<
  P extends { [ E in string ]: (evName: E, ...args: any) => void }
>(opts: {
  publishings: P,
}) {
  type HandlerData<K extends keyof P> = P[ K ] extends (first: any, ...args: infer A) => any ? A : never
  return {
    publish: <K extends keyof P & string>(evName: K, ...data: HandlerData<K>) => {
      if (evName in opts.publishings === false)
        return console.error("unknown event:", evName)
      opts.publishings[ evName ](evName, ...data)
    },
    _$emitMap: {} as GetEmitMap<P>
  }
}

type GetEmitMap<P extends { [ E in string ]: (evName: E, ...args: any) => void }> = { [ K in keyof P ]: P[ K ] extends (first: any, ...args: infer A) => any ? (...data: A) => void : never }


export function EventRouter<
  H extends Record<string, EventHandler>,
>(opts: {
  handlers: H,
  handle: (ws: Bun.ServerWebSocket, name: string, data: any) => MaybePromise<void>
}) {
  const wsMap = new WeakMap<Bun.ServerWebSocket, EventWSClient>()
  return {
    handleJson: async (ws: Bun.ServerWebSocket, data: unknown) => {
      const client = wsMap.get(ws)
      if (!client) return console.error("received message from unknown client")
      if (isValidEventIncomingData(data) === false) return "unknown schema"
      if (data.type in opts.handlers === false)
        return await opts.handle(ws, data.type, data.data)
      await opts.handlers[ data.type ]?.(client, data.data)
    },
    onOpen: (ws: Bun.ServerWebSocket) => wsMap.set(ws, {
      instance: ws,
      sendEvent: (evName: string, data: any) => ws.send(JSON.stringify({ type: evName, data }))
    }),
    onClose: (ws: Bun.ServerWebSocket) => wsMap.delete(ws),
    handlers: opts.handlers,
    _$handlerMap: {} as GetHandlerMap<H>
  }
}

type GetHandlerMap<H extends Record<string, EventHandler>> = { [ K in keyof H ]: H[ K ] extends (first: any, ...rest: infer R) => any ? (...args: R) => void : never }
type EventHandler = (ws: EventWSClient, data: any) => MaybePromise<void>
type EventWSClient = {
  instance: Bun.ServerWebSocket,
  sendEvent: (evName: string, data: any) => void
}
type EventIncomingData = { type: string, data: any }
function isValidEventIncomingData(data: unknown): data is EventIncomingData {
  return typeof data === "object" && data !== null && "type" in data && typeof data.type === "string"
}



// ---

export type RPCPayloadIn = { name: string, args: any }
export type RPCPayloadOut = { result: any }

export function RPCServer<
  M extends Record<string, (...args: any) => MaybePromise<any>>
>(opts: {
  methods: M,
}) {

  const handleEvent: EventHandler =
    async (client, data) => {
      if (typeof data !== "object" || data === null) return console.error("invalid rpc call: data should be an object")
      if (typeof data.name !== "string") return console.error("invalid rpc call: missing rpc name")
      if (typeof data.id !== "string") return console.error("invalid rpc call: missing rpc id")
      const name = data.name
      const args = data.args
      if (name in opts.methods === false)
        return console.error("unknown rpc method:", name)
      const result = await opts.methods[ name ](args)
      client.sendEvent("rpc_response", { id: data.id, result })
    }

  return {
    eventHandlers: { "rpc": handleEvent },
    _$methodMap: {} as GetMethodMap<M>
  }
}

type GetMethodMap<M extends Record<string, (...args: any) => MaybePromise<any>>> = { [ K in keyof M ]: (...args: Parameters<M[ K ]>) => Awaited<ReturnType<M[ K ]>> }





// -----

export function RPCFetch<
  F extends Record<string, (...args: any) => MaybePromise<any>>  
>(opts: {
  methods: F
}) {
  const routeMap = {
    "/rpc": async (req: Bun.BunRequest<"/rpc">) => {
      try {
        const body = await req.json() as RPCPayloadIn
        const name = body.name
        const args = body.args
        if (name in opts.methods === false)
          throw new Error("unknown rpc method: " + name)
        const result = await opts.methods[ name ](args)
        return Response.json({ result: result })
      } catch (error) {
        console.error("error handling RPC fetch request:", error)
        return new Response("server error occured", { status: 500 })
      }
    }
  }

  return {
    routeMap,
    _$methodMap: {} as F
  }
}





// -----

export function appServer<
  H extends Record<string, EventHandler>,
  P extends { [ E in string ]: (evName: E, ...args: any) => void },
  F extends Record<string, (...args: any) => MaybePromise<any>>  
>(config: {
  server: Bun.Server<undefined>,
  ws?: {
    onMessage?:
    (ws: Bun.ServerWebSocket, message: string | Buffer<ArrayBuffer>) => MaybePromise<void>
    onString?:
    (ws: Bun.ServerWebSocket, message: string) => MaybePromise<void>
    onBuffer?:
    (ws: Bun.ServerWebSocket, message: Buffer<ArrayBuffer>) => MaybePromise<void>
    onJson?:
    (ws: Bun.ServerWebSocket, message: any) => MaybePromise<void>
  },
  events?: {
    handlers?: H,
    handle?: (ws: Bun.ServerWebSocket, name: string, data: any) => MaybePromise<void>,
    publishings?: P
  },
  rpc?: {
    methods: F,
  },
}) {
  const rpc = RPCFetch({ methods: config.rpc?.methods ?? {} })

  const eventRouter = EventRouter({
    handlers: {
      ...config.events?.handlers,
    },
    handle: config.events?.handle ?? (() => { })
  })

  const handler = WsHandler({
    handleBuffer: config.ws?.onBuffer,
    handleString: config.ws?.onString,
    handleMessage: config.ws?.onMessage,
    handleJson: async (ws, message) => {
      await config.ws?.onJson?.(ws, message)
      await eventRouter.handleJson(ws, message)
    },
  })

  const publish = EventPublisher({
    publishings: config.events?.publishings ?? {}
  }).publish

  return {
    handler,
    routeHandler: rpc.routeMap,
    publish,
    _$rpcMap: {} as F,
    _$eventEmitMap: {} as GetEmitMap<P>,
    _$eventHandlerMap: {} as GetHandlerMap<H>
  }
}