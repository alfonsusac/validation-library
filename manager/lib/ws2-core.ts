import type { MaybePromise } from "bun"

// ----

export function ServerPublisher<P extends any[]>(
  channel: string,
  encoder: ((...data: P) => string | Buffer<ArrayBuffer>)
) {
  let _server: Bun.Server<undefined> | undefined = undefined
  function subscribe(ws: Bun.ServerWebSocket) {
    ws.subscribe(channel)
  }
  function unsubscribe(ws: Bun.ServerWebSocket) {
    ws.unsubscribe(channel)
  }
  function publish(...message: P) {
    if (!_server) throw new Error("ServerPublisher is not initialized")
    _server.publish(channel, encoder(...message))
  }
  function initialize(server: Bun.Server<undefined>) {
    if (_server) throw new Error("ServerPublisher is already initialized")
    _server = server
  }
  return { subscribe, unsubscribe, publish, initialize }
}

export type ServerPublisher = ReturnType<typeof ServerPublisher>





// ----

export type ServerEventPayload = { event: string, data: any }
export type EventPublisherSchema = { [ E in string ]: (...args: any) => void }
export type ServerEventPublisher = ReturnType<typeof ServerEventPublisher>
export function ServerEventPublisher(
  channel: string,
  onPublish: (payload: { evName: string, data: any }) => any
) {
  return ServerPublisher(
    channel,
    (evName: string, data: any) => {
      onPublish({ evName, data })
      return JSON.stringify({ event: evName, data } satisfies ServerEventPayload)
    }
  )
}

export function EventPublisher<
  P extends EventPublisherSchema
>(publishings: P, opts?: {}) {
  type HandlerData<K extends keyof P> = P[ K ] extends (...args: infer A) => any ? A : never
  return {
    publish: <K extends keyof P & string>(evName: K, ...data: HandlerData<K>) => {
      if (evName in publishings === false)
        return console.error("unknown event:", evName)
      publishings[ evName ](evName, ...data)
    },
    publishings: publishings,
    _$emitMap: {} as GetEmitMap<P>
  }
}

// -

export type EventMap = { [ E in string ]: any[] }
export type EventPublisherFn = (evName: string, ...data: any) => void
export function EventEmitter<
  P extends { [ E in string ]: [any] }
>(publisherFn: EventPublisherFn) {
  return {
    publish: <N extends keyof P & string>(name: N, ...data: P[ N ]) => {
      publisherFn(name, ...data)
    },
    events: {} as P
  }
}



export type Publishings = Record<string, (evName: string, ...args: any) => void>
type GetEmitMap<P extends EventPublisherSchema> = { [ K in keyof P ]: P[ K ] extends (...args: infer A) => any ? (...data: A) => void : never }



// -----

export type RPCPayloadIn = { name: string, args: any }
export type RPCPayloadOut = { result: any }

export function RPCMethods<F extends RPCMethods>(methods: F): F { return methods }

export function RPCFetchHandlers<
  F extends RPCMethods
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
    methods: opts.methods
  }
}
export type RPCMethods = Record<string, (...args: any) => MaybePromise<any>>





// -----

export type AppServer = {
  rpcMethods: Record<string, (...args: any) => MaybePromise<any>>,
  publishings: EventPublisherSchema,
  onServe: (server: Bun.Server<undefined>) => MaybePromise<void>,
}