import { cn } from "lazy-cn"
import { useRef } from "react"
import { useUserSettings } from "../features/user-settings-client"
import { matchRoute } from "../lib/react-route"
import { call, useAppClient } from "./app-client"
import { useQuery } from "../lib/react-store"

export function RoutePage(props: {
  children: React.ReactNode, path: string, classNames?: {
    all?: string,
    shown?: string,
    hidden?: string,
  }
}) {
  const router = useRouter()
  const isCurrentPath = matchRoute(router.current || "", props.path)
  return <div
    className={cn(
      "transition-discrete transition-all absolute inset-0 overflow-x-hidden overflow-y-auto",
      "duration-300 starting:opacity-0",
      "sm:static",
      props.classNames?.all,
      isCurrentPath ? "" : "pointer-events-none",
      isCurrentPath ? props.classNames?.shown : [ props.classNames?.hidden, "sm:translate-x-0 sm:opacity-0 sm:hidden sm:duration-0"],
    )}
    data-current={isCurrentPath ? "" : undefined}
  >
    {props.children}
  </div>
}

export async function navigate(path: string) {
  await call("updateUserSettings", { route: path })
}



export function useRouter() {
  const [ router, updateRouter ] = useQuery("app_router", () => {
    return {
      current: "/",
      history: [] as string[],
    }
  })

  function navigate(path: string) {
    updateRouter({
      current: path,
      history: [ ...router.history, router.current ],
    })
  }

  return {
    ...router,
    navigate
  }
}