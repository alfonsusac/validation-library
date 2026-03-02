type WebSocketController = {
  handleWsMessage: ( //  - run this in bun.serve -> websocket -> onmessage
    message: string | Buffer<ArrayBuffer>,
    ws: Bun.ServerWebSocket,
    server: Bun.Server<undefined>
  ) => Promise<void>,

  publishOnChange: ( //  - run this after bun.server
    server: Bun.Server<undefined>
  ) => void,
}

export type WebSocketPlugin<T extends undefined = undefined> = {
  // T is undefined because for this project, theres no contextual data needed.
  name: string, // optional name for the plugin, useful for debugging and logging
  // All RealtimeHandler should have a message handler
  //  -> handle incoming events.
  handleWsMessage: (
    message: string | Buffer<ArrayBuffer>,
    ws: Bun.ServerWebSocket<T>,
    server: Bun.Server<undefined>
  ) => Promise<string | void>,

  // All RealtimeHandler should have a function to publish data to clients when relevant data changes, e.g. file changes, in-memory data changes, etc.
  //  -> push data to clients.
  // publishOnChange: (
  onServe: (
    server: Bun.Server<undefined>
  ) => Promise<void>,
}


const log = (pluginName: string, message: string) =>
  true ? console.log(`[ws][${ pluginName }] ${ message }`) : null

const logError = (pluginName: string, message: string) =>
  true ? console.error(`[ws][${ pluginName }] ${ message }`) : null

// to be used once, at root, 
// to combine all Handle into one Controller
export function createWebSocketController(
  plugins: WebSocketPlugin[],
): WebSocketController {
  return {

    async handleWsMessage(
      message: string | Buffer<ArrayBuffer>,
      ws: Bun.ServerWebSocket, server: Bun.Server<undefined>
    ) {
      for (const plugin of plugins) {
        try {
          const res = await plugin.handleWsMessage(message, ws, server)
          log(plugin.name, `Handle message result: ${ res }`)
        } catch (error) {
          logError(plugin.name, `Error handling message\n ${ error }`)
        }
      }
    },

    publishOnChange(
      server: Bun.Server<undefined>
    ) {
      Promise.all(plugins.map(async plugin => {
        try {
          await plugin.onServe(server)
        } catch (error) {
          logError(plugin.name, `Error calling onServe\n ${ error }`)
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

