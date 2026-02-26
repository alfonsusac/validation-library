
// HMR-safe global variable manager. 
// Uses Symbol.for to ensure that the same symbol is used across different modules and HMR updates.
export function global<T>(
  name: string,
  init: () => T,
  onHmrDispose?: (value: T) => void,
) {
  // console.log("initializing global variable: ", name)
  // not checking yet if names exists
  const symbol = Symbol.for(name)
  const globl = globalThis as any
  if (globl[ symbol ] === undefined)
    globl[ symbol ] = init()
  function get() {
    return globl[ symbol ] as T
  }
  function set(value: T) {
    globl[ symbol ] = value
  }

  if (import.meta.hot && onHmrDispose) {
    // Yet to test if this works or improves anything.
    import.meta.hot.dispose(() => {
      // console.log(`Disposing global variable: ${ name }`)
      onHmrDispose(get())
      delete globl[ symbol ]
    })
  }

  return [ get, set ] as const
}
