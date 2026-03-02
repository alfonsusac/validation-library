export function lifecycle(init: () => {}, cleanup: () => {}) {
  return [ init, cleanup ] as [ () => void, () => void ]
}