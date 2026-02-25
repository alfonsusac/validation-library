import { loggerWsSchema } from "./lib/event-log"
import { packageJson } from "./lib/event-package-json"
import root from "./root.html"


export const startManager = async () => {
  console.log("Starting server...")
  const server = Bun.serve({
    routes: {
      "/": root,
      "/ws": upgradeWsRoute,
      "/fetch-test": async (req) => {
        const text = await req.text()
        // delay for testing loading states and concurrency and race conditions
        await new Promise(resolve => setTimeout(resolve,
          Math.random() * 2000 + 500
        ))
        return new Response(`Echo: ${ text }`, {})
      }
    },
    websocket: {
      open(ws) {
        console.log("WebSocket connection opened. Count:", server.pendingWebSockets)
        ws.subscribe("global")
      },
      close(ws, code, reason) {
        console.log(`WebSocket connection closed. Code: ${ code }, Reason: ${ reason }. Count:`, server.pendingWebSockets)
        ws.unsubscribe("global")
      },
      message(ws, message) {
        console.log("[ws-message]", message)
        loggerWsSchema.handleMessage(ws, message)
        packageJson.handleWsMessage(ws, message)
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
  packageJson.publishOnChange(server)

  console.log(`Server running at ${ server.url }`)
}




function upgradeWsRoute(req: Bun.BunRequest<"/ws">, server: Bun.Server<undefined>) {
  if (server.upgrade(req)) return undefined // upgrade() will handle the response.
  else return new Response("WebSocket upgrade failed", { status: 400 })
}