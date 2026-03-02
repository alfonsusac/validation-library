// import { createPackageJsonClient } from "./lib/package-json-client"
// import { ProjectSettings } from "./app/ProjectSettings"
import { $JSONFetchRoutesType } from "../index"
import { createJsonFetcher } from "./lib/fetch-schema"
import { createWebSocketCore, WebSocketContext } from "./lib/websocket-client-core"
import { RootLayout } from "./app/pages/RootLayout"
import { AppSocketContext, createAppSocket } from "./app/app-ws"
import { useEffect, useState } from "react"
import { createPackageJsonClient, PackageJsonStoreContext } from "./features/package-json-client"

import.meta.hot.accept()
const ws = createAppSocket('ws://localhost:3000/ws')
import.meta.hot.dispose(ws.cleanup)

const packageJsonStore = createPackageJsonClient(ws)


export const fetchServer = createJsonFetcher<typeof $JSONFetchRoutesType>()

// export const [ usePackageJson ] = createPackageJsonClient()

export function App() {
  // useEffect(() => {
  //   console.log("App mounted")
  //   return () => console.log("App unmounted")
  // })

  const [ count, setCount ] = useState(0)


  return (
    <AppSocketContext.Provider value={ws}>
      <PackageJsonStoreContext.Provider value={packageJsonStore}>
        <RootLayout>
          <button onClick={() => setCount(count + 1)}>Increment in App {count}</button><br />

        </RootLayout>
      </PackageJsonStoreContext.Provider>
    </AppSocketContext.Provider>
  )
}