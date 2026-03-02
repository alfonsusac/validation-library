const root = import.meta.hot.data as {
  afterUpdates: (() => void)[],
  beforeUpdates: (() => void)[],
  cleanUps: (() => void)[],
  store: Record<string, any>
}
root.afterUpdates ??= []
root.beforeUpdates ??= []
root.cleanUps ??= []
root.store ??= {}

console.log("lib-global.tsx reloaded")



// HMR-safe global variable store.
export function global<T>(
  id: string,
  init: () => T,
  cleanup?: (data: T) => void,
  // This is NOT meant to be used to patch the store data during HMR update,
  //  but rather to run side effects after/before HMR update,
  //  such as clearing timers or connections that the store data may have created.
  // This will be run if the global.ts module had changed.
) {
  root.store[ id ] ??= {
    store: init(),
    cleanup: (() => {
      cleanup && root.cleanUps.push(() => cleanup(root.store[ id ].store))
      return cleanup
    })(),
  }

  function get() { return root.store[ id ].store as T }
  function set(value: T) { root.store[ id ].store = value }

  return [ root.store[ id ].store as T, set, get ] as [
    value: T,
    set: (value: T) => void,
    get: () => T
  ]
}



const val = Math.random().toString(16).slice(2, 8)

if (import.meta.hot) {
  // Dispose is triggerd when the module is planned to be discarded
  // due to changes in this code.
  import.meta.hot.dispose(() => {
    console.log("[hmr (global.ts)]: dispose", val)
    root.cleanUps.forEach(cb => cb())
    console.log("------------------------------------------------------")
  })
  // BeforeUpdate is triggered just before the code is re-run but 
  // doesn't necessarily mean the module is discarded.
  import.meta.hot.on("bun:beforeUpdate", () => {
    console.log("[hmr (global.ts)]: bun:beforeUpdate", val)
    root.beforeUpdates.forEach(cb => cb())
  })
  // AfterUpdate is triggered just after the code is re-run
  import.meta.hot.on("bun:afterUpdate", () => {
    console.log("[hmr (global.ts)]: bun:afterUpdate", val)
    root.afterUpdates.forEach(cb => cb())
  })
}


// import.meta.hot.accept()

// // aaa

import.meta.hot.on("bun:afterUpdate", () => {
  console.log("[hmr]: bun:afterUpdate, current value:", val)
})
// import.meta.hot.on("bun:beforeFullReload", () => {
//   console.log("[hmr]: bun:beforeFullReload, current value:", val)
// })
// import.meta.hot.on("bun:beforePrune", () => {
//   console.log("[hmr]: bun:beforePrune, current value:", val)
// })
// import.meta.hot.on("bun:beforeUpdate", () => {
//   console.log("[hmr]: bun:beforeUpdate, current value:", val)
// })
// import.meta.hot.on("bun:error", () => {
//   console.log("[hmr]: bun:error, current value:", val)
// })
// import.meta.hot.on("bun:invalidate", () => {
//   console.log("[hmr]: bun:invalidate, current value:", val)
// })
// import.meta.hot.on("bun:ws:connect", () => {
//   console.log("[hmr]: bun:ws:connect, current value:", val)
// })
// import.meta.hot.on("bun:ws:disconnect", () => {
//   console.log("[hmr]: bun:ws:disconnect, current value:", val)
// })
// import.meta.hot.dispose(() => {
//   console.log("[hmr]: dispose, current value:", val)
// })
// const t = 2 + 2 + 2 + 3

// On First Save, t = 2 + 2
// - bun:beforeUpdate: cfac4c
// - bun:afterUpdate: cfac4c
// - bun:afterUpdate: c14e55

// On Second Save, t = 2 + 2 + 2
// - bun:beforeUpdate: cfac4c
// - bun:beforeUpdate: c14e55
// - dispose: cfac4c
// - dispose: c14e55
// - bun:afterUpdate: 406612






// ---


// On server start,
// - bun:ws:connect 376a63
// - bun:beforeFullReload 376a63
// - [bundled page]
// - bun:ws:connect +e3c58a

// On Save this file,
// - bun:beforeUpdate e3c58a
// - bun:afterUpdate +b13f72

// On Save another file that imports this file,
// - bun:beforeUpdate b13f72
// - bun:afterUpdate b13f72 (no change because this file is not updated, so HMR does not re-run the module code)

// this file saved, b13f72 -> baa3e3
