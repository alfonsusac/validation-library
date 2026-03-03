import { packageJson } from "./features/package-json"
import { wsController } from "./lib/ws-core"
import { pinger } from "./features/ping"
import { renderToString } from "react-dom/server"
import { textFileController } from "./lib/file-controller"
import { appServer, EventPublisher, EventRouter, publisher, RPCFetch, RPCServer, WsHandler } from "./lib/ws2-core"



export const startManager = async () => {
  console.log("Starting server...")

  const wsc = wsController([
    packageJson.websocketPlugin,
    pinger,
  ])

  // Generate the HTML file with the React app rendered on the server
  await renderRoot({
    routeName: '/index.html',
    title: "Fullstack Bun App",
  })

  const rpcFetch = RPCFetch({
    methods: {
      "getTime": () => new Date().toISOString(),
      "getRandomNumber": () => Math.random(),
    }
  })

  const server = Bun.serve({
    development: {
      console: true,
    },
    fetch(req) {
      console.log(`Received request for ${ req.url } ${ req.method }`)
      return new Response("Not Found", { status: 404 })
    },
    routes: {
      "/": (await import("./app/index.html")).default,
      "/ws": upgradeWsRoute,
      ...rpcFetch.routeMap,
    },
    websocket: {
      open(ws) {
        console.log("Client connected. Count:", server.pendingWebSockets)
        globalPublisher.subscribe(ws)
        eventRouter.onOpen(ws)
      },
      close(ws) {
        globalPublisher.unsubscribe(ws)
        eventRouter.onClose(ws)
      },
      message(ws, message) {
        wsHandler.handleMessage(ws, message)
      },
    },
  })



  const wsHandler = WsHandler({
    handleJson: async (ws, message) => {
      const res = await eventRouter.handleJson(ws, message)
      if (res === "unknown schema")
        console.error("Received message with unknown schema:", message)
    }
  })

  const globalPublisher = publisher(server, "global", JSON.stringify)

  const eventPublisher = EventPublisher({
    // publisher: globalPublisher,
    publishings: {
      "pong": (ev) => ({ timestamp: Date.now() }),
    },
  })
  const eventRouter = EventRouter({
    handlers: {
      "ping2": (client) => {
        client.sendEvent("asf", undefined)
        eventPublisher.publish("pong")
      },
      "rpc2": (client, data) => rpcServer.eventHandlers.rpc(client, data)
    },
    handle(ws, name, data) {
      console.log("unknown event received:", name, data)
    },
  })
  const rpcServer = RPCServer({
    methods: {
      "getTime": () => new Date().toISOString(),
      "getRandomNumber": () => Math.random(),
    },
  })

  const app = appServer({
    server,
    rpc: {
      methods: {
        "getTime": () => new Date().toISOString(),
        "getRandomNumber": (prefix: string) => prefix + Math.random(),
      }
    }
  })

  app._$rpcMap















  const packageJson2 = textFileController("./package.json", {
    publish: (data) => globalPublisher.publish(data),

  })


  wsc.registerPluginsOnServe(server)
  console.log(`Server running at ${ server.url }`)
}




function upgradeWsRoute(req: Bun.BunRequest<"/ws">, server: Bun.Server<undefined>) {
  if (server.upgrade(req)) return undefined // upgrade() will handle the response.
  else return new Response("WebSocket upgrade failed", { status: 400 })
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
  // Generate the HTML file with the React app rendered on the server
  await Bun.write(import.meta.dir + '/app' + routeName, "<!-- This file is generated from Server.tsx -->\n" + renderToString(
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







// const { routeHandlers, $JSONFetchRoutesType } = createJsonFetchClient({
//   "GET:/fetch-test":
//     async (query: { text: string }) => {
//       await new Promise(resolve => setTimeout(resolve,
//         Math.random() * 2000 + 500
//       ))
//       return `Echo: ${ query.text }`
//     },
//   "GET:/sdpx-licenses":
//     async () => {
//       return cache(async () => {
//         const res = await fetch("https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/licenses.json")
//         if (!res.ok) throw new Error(`Failed to fetch SPDX licenses: ${ res.status } ${ res.statusText }`)
//         const json = await res.json()
//         const data = json.licenses.map((license: any) => ({
//           id: license.licenseId,
//           name: license.name,
//           isOsiApproved: license.isOsiApproved,
//         }))
//         return data as {
//           id: string
//           name: string
//           isOsiApproved: boolean
//         }[]
//       })()
//     },
// })