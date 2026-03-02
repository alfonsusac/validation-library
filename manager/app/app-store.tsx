import { ws } from "../App"

console.log("app-store.tsx reloaded")

// import.meta.hot.accept("../App", newModule => {

// })

// export function appWs() {
//   const subscribe = (cb: (data: any) => void) => {
//     ws.subscribeMessage(message => {
//       const data = JSON.parse(message.data)
//       cb(data.data)
//     })
//   }
//   return { subscribe }
// }

ws.subscribeMessage(e => {
  console.log("[app-store] [global]")
})




// The ws store concerns with populating store with data with less duplication as possible.
// It must:
// - 1. requestData:    request data if data not available (e.g. when component first mounted)
// - 2. onMessage:      listen on server push data and update store accordingly
// - 3. requestUpdate:  request data update when update function called
// - 4. globalStore:    get the latest store data if data is available on global store
// 
//  * must be called outside of react components

export function appStore<T>(
  name: string,
  opts: {
    requestData: (ws: WebSocket) => void,
    requestUpdate: (ws: WebSocket, newData: T) => void,
    onMessage: (event: MessageEvent<any>) => T | undefined,
  }
) {

}







// export function appStore<T>(name: string, cb: {
//   // Function to request data from server
//   requestData: (ws: WebSocket) => void,
//   // Function to request data update to server
//   requestUpdate: (ws: WebSocket, newData: T) => void,
//   // Function to listen on server push data and return new data to update store, or undefined if not relevant
//   onMessage: (event: MessageEvent<any>) => T | undefined,
// }) {
//   // Global Store
//   const [ useCachedStore, updateCachedStore, getCachedStore ] = createGlobalStore(name, () => null as T | null)

//   function onWsStoreMessageHandler(this: WebSocket, event: MessageEvent<any>) {
//     const newData = cb.onMessage(event)
//     if (newData !== undefined) updateCachedStore(newData)
//   }

//   getWs().addEventListener("message", onWsStoreMessageHandler)
//   if (import.meta.hot) {
//     import.meta.hot.on("bun:beforeUpdate", () => {
//       getWs().removeEventListener("message", onWsStoreMessageHandler)
//     })
//     // DO NOT FORGET to re-register the event listener after update, 
//     //  otherwise the store will not receive server push updates after HMR update.
//     import.meta.hot.on("bun:afterUpdate", () => {
//       getWs().addEventListener("message", onWsStoreMessageHandler)
//     })
//   }

//   // [#1] if no initial data, request data from server as soon as possible
//   if (!getCachedStore()) {
//     if (getWs().readyState !== WebSocket.OPEN) {
//       getWs().addEventListener("open", () => cb.requestData(getWs()), { once: true })
//     } else {
//       cb.requestData(getWs())
//     }
//   }
//   // then listen on server push data and update store accordingly

//   type UseStoreReturn<R extends boolean> = R extends true
//     ? [ NonNullable<T>, (newData: NonNullable<T>) => void ]
//     : [ T, (newData: T) => void ]

//   function useStore<R extends boolean>(
//     required?: R
//   ): R extends true
//     ? [ NonNullable<T>, (newData: NonNullable<T>) => void ]
//     : [ T, (newData: T) => void ] {

//     const [ data ] = useCachedStore()
//     if (data === null && required) {
//       const err = new Error(`Data for ${ name } is required but not available yet.`)
//       Error.captureStackTrace(err, useStore)
//       throw err
//     }

//     function update(newData: T) {
//       cb.requestUpdate(getWs(), newData)
//     }

//     return [ data, update ] as UseStoreReturn<R>
//   }

//   return [ useStore ] as const
// }
