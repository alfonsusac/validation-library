import type { MaybePromise } from "bun"

type WSHandlerCtx = {
  ws: Bun.ServerWebSocket<undefined>,
  server: Bun.Server<undefined>
}

export type WSHandler = {
  name: string,
  handleMessage?: (
    message: string | Buffer<ArrayBuffer>,
    ctx: WSHandlerCtx,
  ) => MaybePromise<string | void>,
  handleString?: (
    message: string,
    ctx: WSHandlerCtx,
  ) => MaybePromise<string | void>,
  handleBinary?: (
    message: Buffer<ArrayBuffer>,
    ctx: WSHandlerCtx,
  ) => MaybePromise<string | void>,
  handleJson?: (
    json: any,
    ctx: WSHandlerCtx,
  ) => MaybePromise<string | void>,
  onServe: (
    server: Bun.Server<undefined>
  ) => Promise<void>,
}

export function wsControllerHandler(opts: WSHandler): WSHandler { return opts }

export function wsController(
  handlers: WSHandler[],
) {
  return {
    async handleWsMessage(
      message: string | Buffer<ArrayBuffer>,
      ws: Bun.ServerWebSocket, server: Bun.Server<undefined>
    ) {
      for (const plugin of handlers) {
        try {
          const msg = await plugin.handleMessage?.(message, { ws, server })
          log(plugin.name, `message.res - ${ msg }`)
          if (typeof message === "string") {
            const str = await plugin.handleString?.(message, { ws, server })
            log(plugin.name, `str.res - ${ str }`)
            try {
              const json = JSON.parse(message)
              const jsonRes = await plugin.handleJson?.(json, { ws, server })
              log(plugin.name, `json.res - ${ jsonRes }`)
            } catch (error) {
              return // not a json, we can ignore it.
            }
          } else {
            const bin = await plugin.handleBinary?.(message, { ws, server })
            log(plugin.name, `binary.res - ${ bin }`)
          }
        } catch (error) {
          logError(plugin.name, `Error handling message\n ${ error }`)
        }
      }
    },
    registerPluginsOnServe(server: Bun.Server<undefined>) {
      Promise.all(handlers.map(async plugin => {
        await plugin.onServe(server).catch(error => logError(plugin.name, `Error calling onServe\n ${ error }`))
      }))
    }
  }
}

const log = (pluginName: string, message: string) => true ? console.log(`ws.${ pluginName } - ${ message }`) : null
const logError = (pluginName: string, message: string) => true ? console.error(`ws.${ pluginName } - ${ message }`) : null

// ---








export function serverWs(
  ws: Bun.ServerWebSocket<undefined>,
  server: Bun.Server<undefined>
) {
  return {
    ...ws,
    publish(channel: string, message: string | Buffer<ArrayBuffer>) {
      server.publish(channel, message)
    }
  }
}