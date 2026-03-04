import { AppSocketContext, createAppSocket } from "./app/app-ws"
import { useEffect, useMemo } from "react"
import { AppCacheStoreContext } from "./lib/react-store"
import { createAppClient } from "./lib/server-client"

// const packageJsonStore = createPackageJsonStore(ws)

export function App() {

  const client = useMemo(() => createAppClient("ws://localhost:3000/ws"), [])
  useEffect(() => () => client.cleanup(), [])

  return (
    <>
    </>
  )

  // const ws = useMemo(() => createAppSocket('ws://localhost:3000/ws'), [])
  // useEffect(() => () => ws.cleanup(), [])

  // const store = useMemo(() => ({}), [])

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