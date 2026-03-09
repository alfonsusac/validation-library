import { useEffect, useLayoutEffect } from "react"
import { call } from "./app/use-app-client"
import { usePackageJson } from "./features/package-json-client"
import { useAsync } from "./lib/react-async"
import { useWS } from "./lib/react-store"


console.log("AppTest.tsx reloaded")
export function TestComponent() {
  
  const ws = useWS()
  
  console.log("<TestComponent> render", !!ws)

  useLayoutEffect(() => {
    console.log("<TestComponent> useEffect")
    const onMessage = (event: MessageEvent) => {
      console.log("<TestComponent> ws message:", event.data)
    }
    ws.addEventListener("message", onMessage)
    return () => {
      console.log("<TestComponent> cleanup")
      ws.removeEventListener("message", onMessage)
    }
  }, [ws])

  return <div className="flex flex-col">
  </div>
}