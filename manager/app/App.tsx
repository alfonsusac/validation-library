import { useEffect, useMemo } from "react"
import { createAppClient } from "../lib/server-client"
import { AppClientContext, useAppClientStore } from "./use-app-client"
import { TestComponent } from "../AppTest"
import { useListenPackageJson } from "../features/package-json-client"
import { RootLayout } from "./pages/RootLayout"

export function App() {

  const client = useAppClientStore("ws://localhost:3000/ws")
  useListenPackageJson(client)

  return (
    <AppClientContext value={client}>
      Hehe
      <RootLayout>
      </RootLayout>
      <TestComponent />
    </AppClientContext>
  )

  // return (
  //   <AppSocketContext.Provider value={ws}>
  //     <AppCacheStoreContext.Provider value={store}>

  //     </AppCacheStoreContext.Provider>
  //     {/* <PackageJsonStoreContext.Provider value={packageJsonStore}> */}
  //     {/* <RootLayout> */}

  //     {/* </RootLayout> */}
  //     {/* </PackageJsonStoreContext.Provider> */}
  //   </AppSocketContext.Provider>
  // )
}