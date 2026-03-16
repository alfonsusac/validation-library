import { cn } from "lazy-cn"
import { matchRoute } from "../lib/react-route"
import { useQuery } from "../lib/react-store"

export function RoutePage(props: {
  children: React.ReactNode,
  path: `/${ string }`,
  classNames?: {
    all?: string,
    shown?: string,
    hidden?: string,
  }
}) {
  const router = useRouter()
  const isCurrentPath = matchRoute(router.current || "", props.path)
  const isNavingBackwardOut = router.meta.direction === "backward" && !isCurrentPath
  const isNavingBackwardIn = router.meta.direction === "backward" && isCurrentPath
  const isNavingForwardOut = router.meta.direction === "forward" && !isCurrentPath
  const isNavingForwardIn = router.meta.direction === "forward" && isCurrentPath
  return <div
    className={cn(
      "transition-discrete transition-all absolute inset-0 ",
      "overflow-x-hidden overflow-y-visible",
      "sm:overflow-visible",
      "duration-300 starting:opacity-0",
      "sm:relative",
      props.classNames?.all,
      isCurrentPath ? "" : "pointer-events-none",
      isCurrentPath
        ? props.classNames?.shown
        : [ props.classNames?.hidden, "hidden" ],
      isNavingBackwardOut && "translate-x-full",
      isNavingBackwardIn && "translate-x-0 opacity-100 starting:-translate-x-20",
      isNavingForwardOut && "-translate-x-20 opacity-0",
      isNavingForwardIn && "translate-x-0 opacity-100 starting:translate-x-full",
    )}
    data-current={isCurrentPath ? "" : undefined}
  >
    {props.children}
  </div>
}



export function useRouter() {
  const [ router, updateRouter ] = useQuery("app_router", () => {
    return {
      current: "/",
      history: [] as string[],
      interruptors: new Set<() => void>,
      meta: {
        direction: null as "forward" | "backward" | null,
      },
    }
  })

  function navigate(path: string, direction: "forward" | "backward" | null) {
    if (router.interruptors.size > 0) {
      router.interruptors.forEach(cb => cb())
      return
    }
    updateRouter({
      current: path,
      history: [ ...router.history, router.current ],
      interruptors: router.interruptors,
      meta: {
        direction,
      },
    })
  }

  function addInterruption(cb: () => void) {
    router.interruptors.add(cb)
    updateRouter(router)
    return () => {
      router.interruptors.delete(cb)
      updateRouter(router)
    }
  }

  return {
    ...router,
    navigate,
    addInterruption,
  }
}