export namespace WebSocketPayload {
  export type toClient = {
    type: string
    data: any
  }
  export type toServer = {
    type: string
    args: any[]
  }

  // Used in the server
  export function decodeFromClient(message: any): toServer {
    if (typeof message !== "string") throw new Error(`Invalid message type: ${ typeof message } | ${ message }`)
    const decoded = JSON.parse(message) as toServer
    if (typeof decoded !== "object" || decoded === null || typeof decoded.type !== "string" || !Array.isArray(decoded.args)) throw new Error(`Invalid message format: ${ message }, decoded: ${ decoded }`)
    return decoded
  }
  export function encodeToClient(payload: toClient): string {
    return JSON.stringify(payload)
  }

  // Used in the client
  export function decodeFromServer(message: any): toClient {
    if (typeof message !== "string") throw new Error(`Invalid message type: ${ typeof message } | ${ message }`)
    const decoded = JSON.parse(message) as toClient
    if (typeof decoded !== "object" || decoded === null || typeof decoded.type !== "string") throw new Error(`Invalid message format: ${ message }, decoded: ${ decoded }`)
    return decoded
  }
  export function encodeToServer(payload: toServer): string {
    return JSON.stringify(payload)
  }

}