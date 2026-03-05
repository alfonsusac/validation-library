import type { MaybePromise } from "bun"
import { RPCFetchHandlers, ServerEventPublisher, type EventMap } from "./ws2-core"
import { renderToString } from "react-dom/server"
import path from "path"

const indexPath = path.join(import.meta.dir, '..', 'app/index.html')

export async function appServer<
  M extends Record<string, (...args: any) => MaybePromise<any>>,
  E extends EventMap,
>(config: {
  publisher: ServerEventPublisher,
  methods?: M,
  events?: E,
  logger?: (...args: any[]) => void,
}) {
  // Prerequisites
  const rpc = RPCFetchHandlers({ methods: config.methods ?? {} })
  await renderRoot({ routeName: '/index.html', title: "Fullstack Bun App", })

  // Start the server
  config.logger?.("Starting server...")
  const server = Bun.serve({
    development: {
      console: true,
    },
    fetch(req) {
      config.logger?.(`Received request for ${ req.url } ${ req.method }`)
      return new Response("Not Found", { status: 404 })
    },
    routes: {
      "/": (await import(indexPath)).default,
      "/ws": upgradeWsRoute,
      ...rpc.routeMap,
    },
    websocket: {
      open(ws) {
        config.logger?.("Client connected. Count:", server.pendingWebSockets)
        config.publisher.subscribe(ws)
      },
      close(ws) {
        config.logger?.("Client disconnected. Count:", server.pendingWebSockets)
        config.publisher.unsubscribe(ws)
      },
      message(ws, message) { },
    }
  })

  // Logging
  const routeCount = 2 + Object.keys(rpc.routeMap).length
  const methodCount = Object.keys(config.methods ?? {}).length
  config.logger?.(`Server running at [${ server.url }]`)
  config.logger?.(`Routes  (${ routeCount }) = /, /ws, ${ Object.keys(rpc.routeMap).join(", ") }`)
  config.logger?.(`Methods (${ methodCount }) = ${ Object.keys(config.methods ?? {}).map(m => `${ m }`).join(", ") }`)
  config.logger?.(``)

  return {
    server,
    _$serverEvents: {} as { [ K in keyof E ]: E[ K ] },
    _$rpcMethods: {} as M,
  }
}






async function renderRoot({
  routeName = '/index.html',
  title = "Fullstack Bun App",
  payload = {},
}: {
  routeName: string,
  title: string,
  payload?: any,
}) {
  // const htmlpath = path.join(indexPath + routeName)

  // Generate the HTML file with the React app rendered on the server
  await Bun.write(indexPath, "<!-- This file is generated from Server.tsx -->\n" + renderToString(
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link rel="stylesheet" href="../app/styles.css" />
      </head>
      <body>
        <div id="root"></div>
        <div id="payload" data-payload={JSON.stringify(payload)}></div>
        <script type="module" src="../app/Root.tsx"></script>
      </body>
    </html>
  ))
}

function upgradeWsRoute(req: Bun.BunRequest<"/ws">, server: Bun.Server<undefined>) {
    if (server.upgrade(req)) return undefined // upgrade() will handle the response.
    else return new Response("WebSocket upgrade failed", { status: 400 })
}

