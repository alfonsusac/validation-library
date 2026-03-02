// import { createPackageJsonClient } from "./lib/package-json-client"
// import { ProjectSettings } from "./app/ProjectSettings"
import { useEffect } from "react"
import { $JSONFetchRoutesType } from "../index"
import { createWebSocket } from "./lib/client-ws"
import { createJsonFetcher } from "./lib/fetch-schema"

console.log("App.tsx - reloaded")
import.meta.hot.accept()

export const ws = createWebSocket('ws://localhost:3000/ws')
import.meta.hot.dispose(() => ws.cleanup())
import.meta.hot.dispose(() => console.log("App.tsx - cleaning up "))

const cleanup = ws.subscribeMessage(e => console.log("[app] [global]"))
import.meta.hot.dispose(() => cleanup())

// appWs


// export const [ usePackageJson ] = createPackageJsonClient()
export const fetchServer = createJsonFetcher<typeof $JSONFetchRoutesType>()

export function App() {

  // This is how you listen to ws with useEffect
  useEffect(() => {
    return ws.subscribeMessage(e => console.log("[app] [useEffect]"))
  })



  // const [ packageJSON ] = usePackageJson()
  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen p-4">
      <div className="font-semibold text-sm text-fg3">Package Manager</div>
      {/* <h1 className="font-mono text-2xl break-all">{packageJSON?.name}</h1>
      <div className="pb-12" />
        
      <h2 className="font-medium text-xl text-fg4">Project Settings</h2>
      {packageJSON ? <ProjectSettings packageJSON={packageJSON} /> : null} */}

      <footer className="pt-20">

      </footer>
    </div>
  )
}