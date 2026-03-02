import { createJsonFetchClient } from "./lib/fetch-schema"
import { createCache } from "./lib/lib-cache"
import { packageJson } from "./features/package-json"
import { getSettings, saveSettings } from "./lib/app-settings"
import { createWebSocketController } from "./lib/websocket-core"
import { pinger } from "./features/ping"
import { renderToString } from "react-dom/server"



export const startManager = async () => {
  console.log("Starting server...")

  const cache = createCache({ store: new Map<string, any>() })
  const wsHandler = createWebSocketController([
    packageJson.websocketPlugin,
    pinger,
  ])

  const { routeHandlers, $JSONFetchRoutesType } = createJsonFetchClient({
    "GET:/settings": getSettings,
    "POST:/settings": saveSettings,
    "GET:/fetch-test":
      async (query: { text: string }) => {
        await new Promise(resolve => setTimeout(resolve,
          Math.random() * 2000 + 500
        ))
        return `Echo: ${ query.text }`
      },
    "GET:/sdpx-licenses":
      async () => {
        return cache(async () => {
          const res = await fetch("https://raw.githubusercontent.com/spdx/license-list-data/refs/heads/main/json/licenses.json")
          if (!res.ok) throw new Error(`Failed to fetch SPDX licenses: ${ res.status } ${ res.statusText }`)
          const json = await res.json()
          const data = json.licenses.map((license: any) => ({
            id: license.licenseId,
            name: license.name,
            isOsiApproved: license.isOsiApproved,
          }))
          return data as {
            id: string
            name: string
            isOsiApproved: boolean
          }[]
        })()
      },
  })

  // Generate the HTML file with the React app rendered on the server
  await renderRoot({
    routeName: '/index.html',
    title: "Fullstack Bun App",
  })

  const server = Bun.serve({
    routes: {
      "/": (await import("./app/index.html")).default,
      "/ws": upgradeWsRoute,
      ...routeHandlers,
    },
    websocket: {
      open(ws) {
        console.log("Client connected. Count:", server.pendingWebSockets)
        ws.subscribe("global")
      },
      close(ws, code, reason) {
        // console.clear()
        // console.log(`Client closed. Code: ${ code }, Reason: ${ reason }. Count:`, server.pendingWebSockets)
        ws.unsubscribe("global")
      },
      message(ws, message) {
        console.log("[ws-message]", message.slice(0, 20)) // log first 20 chars for brevity
        wsHandler.handleWsMessage(message, ws, server)
      },
    },
    // Fallback for unmatched routes
    fetch(req) {
      console.log(`Received request for ${ req.url } ${ req.method }`)
      return new Response("Not Found", { status: 404 })
    },

    development: {
      console: true,
    }
  })

  // Update clients with the initial package.json data when file changes
  wsHandler.publishOnChange(server)

  console.log(`Server running at ${ server.url }`)

  return {
    $JSONFetchRoutesType
  }
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