// import type { WebSocketPlugin } from "./websocket-core"


// // This is the schema that users will define when creating a
// //  WebSocket plugin.
// type WSSchema = {
//   rpc?: // emit-only
//   { [ key: string ]: ((...args: any[]) => any) },
//   commands?:
//   { [ key: string ]: any[] },
//   broadcasts?:   // publish-only
//   { [ key: string ]: any }
// }
// // return types and parameters are any because while,
// //  json.parse/stringify only support certain types,
// //  it is up to the caller to define how to serialize/deserialize
// //  custom classes or unsupported types.

// type WSPublishClient<Broadcasts extends WSSchema[ "broadcasts" ]> = {
//   publish: <EvName extends keyof Broadcasts & string>(
//     evName: EvName,
//     data: Broadcasts[ EvName ] extends infer R ? R : never
//   ) => void
// }

// type WSRPCFuncMap<Broadcasts extends WSSchema[ 'broadcasts' ]> = {
//   [ key: string ]: (ws: WSPublishClient<Broadcasts>, ...args: any[]) => any
// }


// export function createServerBroadcastMap<
//   Schema extends { [ key in keyof Schema ]: (...args: any[]) => any }
// >(schema:
//   { [ K in keyof Schema ]: (...args: any[]) => Schema[ K ] }
// ) {
//   return schema
// }





// // to be used in plugin / each modules,
// // to create a client to send/receive data from/to server,
// export function createWebSocketPlugin<
//   // Broadcasts extends WSSchema[ "broadcasts" ] = {},
//   // RPCs extends WSSchema[ "rpc" ] = {},
//   // RPCs extends WSRPCFuncMap<Broadcasts>,
//   RPCs extends {
//     [ key: string ]: (ws: WSPublishClient<Broadcasts>, ...args: any[]) => any
//   },
//   Commands extends WSSchema[ "commands" ],
//   Broadcasts extends WSSchema[ "broadcasts" ],
// >(opts: {
//   broadcasts:
//   { [ K in keyof Broadcasts ]: () => Broadcasts[ K ] },
//   // rpc?: RPCs,
//   // { [ K in keyof RPCs ]: RPCs[ K ] },
//   commands:
//   { [ K in keyof Commands ]: (ws: WSPublishClient<NoInfer<Broadcasts>>, ...args: Commands[ K ] extends any[] ? Commands[ K ] : never) => void },
//   rpc?: RPCs,


//   onServe?:
//   (ws: WSPublishClient<NoInfer<Broadcasts>>, server: Bun.Server<undefined>) => void,

//   decode?: (message: string | Buffer<ArrayBuffer>) => any,
//   encode?: (eventName: string, data: any) => string | Bun.ArrayBufferView | ArrayBuffer | SharedArrayBuffer
// }) {


//   type EmitEvNames = keyof RPCs & string
//   type SrvrEmtPyld<EvName extends EmitEvNames> =
//     RPCs[ EvName ] extends (...args: any[]) => infer R ?
//     R : never

//   type BrdcstEvNames = keyof Broadcasts & string
//   type SrvrBrdcstPyld<EvName extends BrdcstEvNames> =
//     Broadcasts[ EvName ] extends infer R ? R : never

//   const encode = opts.encode ?? ((eventName, data) => JSON.stringify({ name: eventName, data }))
//   const decode = opts.decode ?? ((message) => JSON.parse(message.toString()))

//   // utils
//   const validateMessage = (message: string | Buffer<ArrayBuffer>) => {
//     const decoded =
//       decode(message)
//     if (typeof decoded !== "object" || decoded === null) {
//       console.log("[websocket-plugin] Invalid message format: decoded message is not an object.")
//       return "invalid"
//     }
//     if ("name" in decoded === false || "data" in decoded === false) {
//       console.log("[websocket-plugin] Invalid message format: decoded message should have 'name' and 'data' properties.")
//       return "invalid"
//     }
//     if (typeof decoded.name !== "string") {
//       console.log("[websocket-plugin] Invalid message format: 'name' property should be a string.")
//       return "invalid"
//     }
//     return {
//       name: decoded.name as string,
//       data: decoded.data
//     }
//   }

//   const rpcMap = opts.rpc ?? {} as { [ K in keyof RPCs ]: RPCs[ K ] }
//   const commandsMap = opts.commands ?? {} as { [ K in keyof Commands ]: (...args: Commands[ K ] extends any[] ? Commands[ K ] : never) => void }

//   return {
//     handleWsMessage(message, ws) {

//       // caller-exposed methods
//       const emit = <EvName extends EmitEvNames>
//         (evName: EvName, data: SrvrEmtPyld<EvName>) =>
//         ws.send(encode(evName, data))
//       const publishClient: WSPublishClient<Broadcasts> = {
//         publish: (evName, data) =>
//           ws.publish("global", encode(evName, data))
//       }

//       // process messages
//       const decoded = validateMessage(message)
//       if (decoded === 'invalid') return "decode fail"

//       // handle rpc calls
//       if (decoded.name in (rpcMap)) {
//         const rpcFn = rpcMap[ decoded.name as keyof RPCs ]
//         if (typeof rpcFn !== "function")
//           return "not found"
//         const result = rpcFn(publishClient, ...decoded.data)
//         if (result instanceof Promise) {
//           result.then(res => emit(decoded.name as EmitEvNames, res))
//           return "async response will be sent"
//         } else {
//           emit(decoded.name as EmitEvNames, result)
//           return "response sent"
//         }
//       }

//       // handle commands
//       if (decoded.name in (commandsMap)) {
//         const command = commandsMap[ decoded.name as keyof Commands ]
//         if (typeof command !== "function")
//           return "not found"
//         return command(publishClient, ...decoded.data)
//       }
//     },


//     publishOnChange(server) {
//       const publishClient: WSPublishClient<Broadcasts> = {
//         publish: (evName, data) =>
//           server.publish("global", encode(evName, data))
//       }
//       opts.onServe?.(publishClient, server)

//       // publish data when relevant data changes
//     }
//   } satisfies WebSocketPlugin


// }

// // usage tests
// const t = createWebSocketPlugin({
//   commands: {
//     "hello"(ws, i: string) {
//       console.log("hello command received!")
//     }
//   },
//   broadcasts: {
//     "time": () => new Date().toISOString()
//   },
//   decode(message) {
//     return JSON.parse(message.toString())
//   },
//   encode(eventName, data) {
//     return JSON.stringify({ name: eventName, data })
//   },
//   rpc: {
//     "add"(ws, a: number, b: string) {
//       return a + b
//     },
//     async "add2"(ws, a: string, b: number) {
//       return a + b
//     },
//   }
// })


// // function test<M extends {
// //   [ key: string ]: (w: string, ...args: any[]) => any
// // }>(m: {
// //   map: M
// // }) { }

// // test({
// //   map: {
// //     "add"(ws, a: number, b: string) {
// //       return a + b
// //     },
// //     async "add2"(ws, a: string, b: number) {
// //       return a + b
// //     },
// //   }
// // })

// // function test<M extends {
// //   [ K in keyof M ]: string
// // }>(m: M) { }

// // function test2<M extends {
// //   [ K: string ]: string
// // }>(e: {
// //   map: M
// // }) { }

// // test({ map: {} })
// // test2({ map: {} })
// // test({
// //   a: "hello",
// //   b: "world"
// // })








// // impossible to transform the inferred types from createWebSocketPlugin into a more user-friendly format,
// // function test<
// //   M extends {
// //     [ K in keyof M ]: M[ K ] extends {
// //       data: infer A,
// //       return: infer B,
// //     } ? {
// //       data: A extends any[] ? A : never,
// //       return: B
// //     } : {
// //       data: any[],
// //       return: any
// //     }
// //   },
// // >(
// //   fns: {
// //     [ K in keyof M ]: (...args: M[ K ][ 'data' ]) => ReturnType<M[ K ][ 'return' ]>
// //   }
// // ) { }

// // test<{
// //   add: {
// //     data: [ a: number, b: string ],
// //     return: string
// //   }
// // }>({
// //   add: ((a: number, b: string) => a + b),
// //   // "add"(a: boolean, b: string) {
// //   //   return a + b
// //   // },
// //   // "add2"(a: string, b: string) {
// //   //   return a + b
// //   // },
// // })