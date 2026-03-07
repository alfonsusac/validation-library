import { createContext, use, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createAppClient, type AppClient } from "../lib/server-client"
import type { ManagerServerEvents, ManagerServerMethods } from "../Server"
import { getErrorMessage } from "../lib/util-get-error-message"
import { useUserSettings } from "../features/user-settings-client"
import { matchRoute } from "../lib/react-route"
import { cn } from "lazy-cn"


export type ManagerAppClient = AppClient<ManagerServerEvents>

export const AppClientContext = createContext(null as null | ManagerAppClient)

export function useAppClient<T extends boolean = false>(required?: T) {
  const client = use(AppClientContext)
  if (!client && required) throw new Error("client not yet instantiated")
  return client as T extends true ? NonNullable<typeof client> : typeof client
}

export function useAppClientStore(url: string) {
  const [ client, setClient ] = useState<AppClient<ManagerServerEvents> | null>(null)

  useEffect(() => {
    const newClient = createAppClient(url)
    setClient(newClient)
    return () => {
      newClient.cleanup()
      setClient(null)
    }
  }, [ url ])

  return client
}

export function AppClientProvider(props: { children: React.ReactNode, url: string }) {
  const client = useAppClientStore(props.url)
  if (client === null) return null
  return <AppClientContext value={client}>
    {props.children}
  </AppClientContext>
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

// --------

// Routing

export function RoutePage(props: {
  children: React.ReactNode, path: string, classNames?: {
    all?: string,
    shown?: string,
    hidden?: string,
  }
}) {
  const { userSettings } = useUserSettings()

  const currentRouteRef = useRef<string>(null)
  const prevRouteRef = useRef<string>(null)

  prevRouteRef.current = currentRouteRef.current || ""
  currentRouteRef.current = userSettings?.route || ""

  const isCurrentPath = matchRoute(userSettings?.route || "", props.path)

  return <div
    className={cn(
      "transition-discrete transition-all absolute inset-0 overflow-x-hidden overflow-y-auto",
      isCurrentPath ? "" : "pointer-events-none",
      isCurrentPath ? props.classNames?.shown : props.classNames?.hidden,
      "duration-300 starting:opacity-0",
      props.classNames?.all,
    )}
    data-current={isCurrentPath ? "" : undefined}
  >
    {props.children}
  </div>
}

export async function navigate(path: string) {
  await call("updateUserSettings", { route: path })
}



// const isGoingBack = prevRouteRef.current?.includes(currentRouteRef.current)
// const isGoingForward = currentRouteRef.current.includes(prevRouteRef.current ?? "_")

// const ref = useRef<HTMLDivElement>(null)
// useEffect(() => {
//   if (!isCurrentPath) return
//   ref.current?.scrollTo(0, 0)
// }, [ isCurrentPath ])

// ref={ref}
// data-route-direction={isGoingForward ? "forward" : isGoingBack ? "backward" : undefined}
