import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import type { WSEventMap } from "./socket-types"
import { createClientWS } from "./socket-core"
import type { PackageJson, PackageJSONEventMap } from "./event-package-json"
import { createStore } from "./react-store"

// const socket = createClientWS<SocketClientToServerPayload>()

const socket = new WebSocket("ws://localhost:3000/ws")

export function useSocket<
  Evs extends WSEventMap
>(opts?: {
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
  onMessage?: {
    [ N in keyof Evs ]?: (payload: ReturnType<Evs[ N ]>) => void
  }
}) {
  const client = useMemo(() => createClientWS<Evs>(socket), [])

  useEffect(() => {
    return client.register({
      onOpen() { opts?.onOpen?.() },
      onClose() { opts?.onClose?.() },
      onError(error) { opts?.onError?.(error) }
    })
  }, [])

  useEffect(() => {
    if (!opts?.onMessage) return
    const unsubs: (() => void)[] = []
    for (const name in opts.onMessage) {
      const callback = opts.onMessage[ name as keyof Evs ]
      if (!callback) continue
      const unsub = client.listenTo(name as keyof Evs, payload => callback(payload))
      unsubs.push(unsub)
    }
    return () => unsubs.forEach(unsub => unsub())
  }, [])

  return {
    emit: client.emit,
    listenTo: client.listenTo,
  }
}


const packageJson = createStore<PackageJson | null>(null)




export function usePackageJSON() {

  const data = useSyncExternalStore(
    packageJson.subscribe,
    packageJson.getSnapshot,
    packageJson.getSnapshot,
  )

  // const [ packageJsonState, setPackageJsonState ] = useState<PackageJson>()
  
  
  
  
  const socket = useSocket<PackageJSONEventMap[ '$clientEvMap' ]>({
    onMessage: {
      getPackageJSON: payload => packageJson.update(payload)
    }
  })

  useEffect(() => {
    const unsub = socket.listenTo("getPackageJSON", packageJson => {
      setPackageJsonState(packageJson)
    })
    socket.emit("getPackageJSON")
    return unsub
  }, [])

  return {
    data: packageJsonState,
    update: (newData: PackageJson) => {
      socket.emit("updatePackageJSON", newData)
    }
  }
}