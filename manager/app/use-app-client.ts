import { createContext, use, useEffect, useMemo } from "react"
import { createAppClient, type AppClient } from "../lib/server-client"
import type { ManagerServerEvents, ManagerServerMethods } from "../Server"
import { getErrorMessage } from "../lib/util-get-error-message"


export type ManagerAppClient = AppClient<ManagerServerEvents>

export const AppClientContext = createContext(undefined as undefined | AppClient<
  ManagerServerEvents
>)

export function useAppClient() {
  const client = use(AppClientContext)
  if (!client) throw new Error("useAppClient must be used within an AppClientContext provider")
  return client
}

export function useAppClientStore(url: string) {
  const client = useMemo(() => createAppClient(url), [])
  useEffect(() => () => client.cleanup(), [])
  return client as ManagerAppClient
}

export async function call<T extends keyof ManagerServerMethods>(name: T, ...args: Parameters<ManagerServerMethods[ T ]>) {
  try {
    const res = await fetch(`/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, args })
    })
    const json = await res.json()
    return json.result as ManagerServerMethods[ T ] extends (...args: any) => infer R ? Awaited<R> : never
  } catch (error) {
    console.error("Error calling server method", name, getErrorMessage(error))
    throw error
  }
}