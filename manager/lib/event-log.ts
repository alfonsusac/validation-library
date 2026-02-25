import { createWsSchema } from "./socket-core"

export const loggerWsSchema = createWsSchema({
  async log(ws, message: string) {
    console.log(`[client log] ${ message }`)
  },
})

