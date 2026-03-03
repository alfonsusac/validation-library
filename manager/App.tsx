import { RootLayout } from "./app/pages/RootLayout"
import { AppSocketContext, createAppSocket } from "./app/app-ws"
import { createPackageJsonStore, PackageJsonStoreContext } from "./features/package-json-client"
import { useEffect, useMemo, useState } from "react"

// import.meta.hot.accept()
// const ws = createAppSocket('ws://localhost:3000/ws')
// import.meta.hot.dispose(ws.cleanup)

// const packageJsonStore = createPackageJsonStore(ws)

export function App() {

  const ws = useMemo(() => createAppSocket('ws://localhost:3000/ws'), [])
  useEffect(() => () => ws.cleanup(), [])

  return (
    <AppSocketContext.Provider value={ws}>
      {/* <PackageJsonStoreContext.Provider value={packageJsonStore}> */}
      {/* <RootLayout> */}

      {/* </RootLayout> */}
      {/* </PackageJsonStoreContext.Provider> */}
    </AppSocketContext.Provider>
  )
}