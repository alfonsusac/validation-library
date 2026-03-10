import { createContext, use, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createAppClient, type AppClient } from "../lib/server-client"
import type { ManagerServerEvents, ManagerServerMethods } from "../Server"
import { getErrorMessage } from "../lib/util-get-error-message"
import { useUserSettings } from "../features/user-settings-client"
import { matchRoute } from "../lib/react-route"
import { cn } from "lazy-cn"
import { useQuery } from "../lib/react-store"


export type ManagerAppClient = AppClient<ManagerServerEvents>

export function useAppClient() {
  const [ appClient ] = useQuery("appClient", (cleanup) => {
    const client = createAppClient<ManagerServerEvents>(`ws://localhost:3000/ws`)
    cleanup(() => {
      client.cleanup()
    })
    return client
  })
  return appClient
}

//------------
// RPC call helper

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

//------------
// Routing
