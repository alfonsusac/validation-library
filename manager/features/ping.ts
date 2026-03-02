import { nanoid } from "nanoid"
import { wsplugin } from "../lib/websocket-plugin"

export const pinger = wsplugin({
  broadcasts: {
    "ping": () => "ping " + nanoid(3)
  },
  onServe(server) {
    setInterval(() => {
      server.broadcast("ping")
    }, 1000)
  },
})