import { $JSONFetchRoutesType } from "../index"
import { createJsonFetcher } from "./lib/fetch-schema"
import { RootLayout } from "./app/pages/RootLayout"
import { AppSocketContext, createAppSocket } from "./app/app-ws"
import { useState } from "react"
import { createPackageJsonStore, PackageJsonStoreContext } from "./features/package-json-client"

import.meta.hot.accept()
const ws = createAppSocket('ws://localhost:3000/ws')
import.meta.hot.dispose(ws.cleanup)

console.log("Hello")
const packageJsonStore = createPackageJsonStore(ws)



export function App() {

  const [ count, setCount ] = useState(0)


  return (
    <AppSocketContext.Provider value={ws}>
      <PackageJsonStoreContext.Provider value={packageJsonStore}>
        <RootLayout>

        </RootLayout>
      </PackageJsonStoreContext.Provider>
    </AppSocketContext.Provider>
  )
}