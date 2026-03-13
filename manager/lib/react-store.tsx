import { createContext, use, useEffect, useState, useSyncExternalStore } from "react"
import { Listener } from "./util-listener"
import { nanoid } from "nanoid"
import type { MaybePromise } from "bun"

export type Store<T> = ReturnType<typeof newStore<T>>
type Initializer<T> = () => T

export function newStore<T>(initialValue: Initializer<T>) {
  const id = nanoid(3)
  function ECLND() { throw new Error(`Store already cleaned up. Can't operate on store if it is already cleaned up.`) }
  const ref = {
    curr: initialValue(),
    listeners: new Listener<T>,
    cleaned: false,
  }
  function get() {
    if (ref.cleaned) ECLND()
    return ref.curr
  }
  function update(newdata: T) {
    if (ref.cleaned) ECLND()
    ref.listeners.emit(ref.curr = newdata)
  }
  function subscribe(listener: (data: T) => void) {
    if (ref.cleaned) ECLND()
    return ref.listeners.subscribe(listener)
  }
  function cleanup() {
    if (ref.cleaned) ECLND()
    ref.listeners.clear()
    ref.cleaned = true
  }
  function length() {
    return ref.listeners.length()
  }
  return { update, get, subscribe, cleanup, id, length }
}








type QueryClient = ReturnType<typeof newQueryClient>
type StoreEntry<T> = {
  store: Store<T>,
  cleanups: (() => void)[],
}

export function newQueryClient() {
  const storeMap = newStore<Record<string, StoreEntry<any>>>(() => ({}))
  function getStore<T>(key: string) {
    const entry = storeMap.get()[ key ]
    if (!entry) return undefined
    return entry.store as Store<T>
  }
  function registerStore<T>(
    key: string,
    create: (
      clean: (c: () => void) => void,
      update: (newData: T) => void
    ) => MaybePromise<T>,
  ) {
    const storeMapData = storeMap.get()
    if (storeMapData[ key ])
      return storeMapData[ key ].store as Store<T>
    const cleanups: (() => void)[] = []
    const clean = (c: () => void) => { cleanups.push(c) }
    const update = (newData: T) => {
      const store = storeMapData[ key ]?.store
      if (!store) throw new Error(`Store with key ${ key } not found. Can't update non-existing store.`)
      store.update(newData)
    }
    const store = newStore(() => {
      const res = create(clean, update)
      if (res instanceof Promise) {
        res.then(data => store.update(data))
        return undefined as unknown as T
      } else {
        return res
      }
    })
    storeMapData[ key ] = { store, cleanups }
    storeMap.update(storeMapData)
    return storeMapData[ key ].store as Store<T>
  }
  function cleanup() {
    const map = storeMap.get()
    Object.entries(map).forEach(([ key, entry ]) => {
      entry.cleanups.forEach(cleanup => cleanup())
      entry.store.cleanup()
      delete map[ key ]
    })
    storeMap.cleanup()
  }
  return {
    storeMap, getStore, registerStore, cleanup
  }
}


const QueryClientContext = createContext<QueryClient>(null as any)

export function useQueryClientStore() {
  const [ client, setClient ] = useState<QueryClient>()
  useEffect(() => {
    const qc = newQueryClient()
    setClient(qc)
    return () => qc.cleanup()
  }, [])
  return client
}

export function QueryClientProvider(props: {
  children: React.ReactNode,
  qc: QueryClient | undefined,
}) {
  if (!props.qc) return null
  return <QueryClientContext value={props.qc}>
    {props.children}
  </QueryClientContext>
}




export function useQueryClient() {
  const client = use(QueryClientContext)
  if (!client) throw new Error("QueryClientContext not found")
  return client
}

export function useQuery<T, T2 = T>(
  key: string,
  create: (
    clean: (c: () => void) => void,
    update: (newData: T) => void
  ) => MaybePromise<T>,
  selector: ((data: T) => T2) = ((data: T) => data as unknown as T2),
  required?: boolean // will throw error if true and data is not available yet
) {
  const client = useQueryClient()
  const data = useSyncExternalStore(
    (l) => {
      const store = client.registerStore<T>(key, create)
      return store.subscribe(l)
    },
    () => {
      const store = client.registerStore<T>(key, create)
      return selector(store.get())
    }
  )
  if (required && data === undefined) {
    throw new Error(`Data for store ${ key } is required but not available yet.`)
  }
  function update(newData: Updater<T>) {
    const store = client.getStore<T>(key)
    if (!store) throw new Error(`Store with key ${ key } not found. Can't update non-existing store.`)
    const next =
      typeof newData === "function"
        ? (newData as (prev: T) => T)(store.get())
        : newData
    store.update(next)
  }

  return [ data, update ] as [ T2, (newData: T) => void ]
}

export type Updater<T> = T | ((prevData: T) => T)
export function resolveUpdater<T>(updater: Updater<T>, prevData: T): T {
  return typeof updater === "function"
    ? (updater as (prev: T) => T)(prevData)
    : updater
}

export function useWS() {
  const id = "wss"
  const [ ws ] = useQuery(id, (clean) => {
    console.log(`connecting to ${ id }...`)
    const ws = new WebSocket("ws://localhost:3000/ws")
    clean(() => {
      console.log(`closing ${ id }...`)
      ws.close()
    })
    return ws
  })
  return ws
}

export function getHello() {
  return "hello"
}


