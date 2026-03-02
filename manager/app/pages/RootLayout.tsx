import { use, useEffect, useState } from "react"
import { WebSocketContext } from "../../lib/websocket-client-core"
import { AppSocketContext } from "../app-ws"
// import { useWebSocket, WebSocketContext } from "../app-context"

export function RootLayout(props: { children?: React.ReactNode }) {


  // useEffect(() => {
  //   console.log("RootLayout mounted")
  //   return () => console.log("RootLayout unmounted")
  // })

  // useEffect(() => {
  //   console.log("RootLayout mounted")
  // }, [])
  // const ws = use(AppSocketContext)
  // useEffect(() => {
  //   return ws?.instance.subscribeMessage((ev: { data: any }) => {
  //     console.log("Received message:", ev.data)
  //   })
  // }, [ ws ])
  const [ count, setCount ] = useState(0)

  // const [ packageJSON ] = usePackageJson()
  return (
    <div className="bg-bg text-fg min-w-screen min-h-screen p-4">
      <div className="font-semibold text-sm text-fg-3">Package Manager</div>
      <button onClick={() => setCount(count + 1)}>Increment in RootLayout {count}</button><br />

      {props.children}
      {/* <h1 className="font-mono text-2xl break-all">{packageJSON?.name}</h1>
      <div className="pb-12" />
        
      <h2 className="font-medium text-xl text-fg-4">Project Settings</h2>
      {packageJSON ? <ProjectSettings packageJSON={packageJSON} /> : null} */}

      <footer className="pt-20">

      </footer>
    </div>
  )
}