type WebSocketController = {
  //  - run this in bun.serve -> websocket -> onmessage
  handleWsMessage: (
    message: string | Buffer<ArrayBuffer>,
    ws: Bun.ServerWebSocket,
    server: Bun.Server<undefined>
  ) => Promise<void>,

  //  - run this after bun.server
  publishOnChange: (
    server: Bun.Server<undefined>
  ) => void,
}

export type WebSocketPlugin<CT extends undefined = undefined> = {
  // T is undefined because for this project, theres no contextual data needed.

  // All RealtimeHandler should have a message handler
  //  -> handle incoming events.
  handleWsMessage: (
    message: string | Buffer<ArrayBuffer>,
    ws: Bun.ServerWebSocket<CT>,
    server: Bun.Server<undefined>
  ) => Promise<string | void>,

  // All RealtimeHandler should have a function to publish data to clients when relevant data changes, e.g. file changes, in-memory data changes, etc.
  //  -> push data to clients.
  // publishOnChange: (
  onServe: (
    server: Bun.Server<undefined>
  ) => Promise<void>,
}


// to be used once, at root, 
// to combine all Handle into one Controller
export function createWebSocketController(
  plugins: WebSocketPlugin<any>[],
): WebSocketController {
  return {

    async handleWsMessage(message: string | Buffer<ArrayBuffer>, ws: Bun.ServerWebSocket, server: Bun.Server<undefined>) {
      for (const plugin of plugins) {
        try {
          const res = await plugin.handleWsMessage(message, ws, server)
          console.log("[ws-core] handleMessage result:", res)
        } catch (error) {
          console.error("[ws-core] Error handling message\n", error)
        }
      }
    },

    publishOnChange(server: Bun.Server<undefined>) {
      const publishFn = ( // is a dependency
        data: string | Bun.ArrayBufferView | ArrayBuffer | SharedArrayBuffer,
        compress?: boolean,
      ) => server.publish("global", data, compress)

      // for (const plugin of plugins) {
      //   try {
      //     await plugin.onServe(server)
      //   } catch (error) {
      //     console.error("[ws-core] Error calling onServe\n", error)
      //   }
      // }

      Promise.all(plugins.map(async plugin => {
        try {
          await plugin.onServe(server)
        } catch (error) {
          console.error("[ws-core] Error calling onServe\n", error)
        }
      }))
    }
  }
}







// to be used in plugin / each modules,
// to create a client to send/receive data from/to server,
export function createCoreWebSocketPlugin(opts: WebSocketPlugin) {
  return opts
}

