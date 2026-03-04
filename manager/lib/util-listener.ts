export class Listener<D> {

  private listeners = new Set<(data: D) => void>()
  private wrappedListeners = new Map<(data: D) => void, (data: D) => void>()

  add(listener: (data: D) => void, opts?: { once?: boolean }) {
    if (this.listeners.has(listener) || this.wrappedListeners.has(listener)) return
    if (!opts?.once) {
      this.listeners.add(listener)
      return
    }
    const wrapped = (data: D) => {
      this.remove(listener)
      listener(data)
    }
    this.listeners.add(wrapped)
    this.wrappedListeners.set(listener, wrapped)
  }
  remove(listener: (data: D) => void) {
    const wrapper = this.wrappedListeners.get(listener)
    if (wrapper) {
      this.listeners.delete(wrapper)
      this.wrappedListeners.delete(listener)
    } else {
      this.listeners.delete(listener)
    }
  }
  subscribe(listener: (data: D) => void, opts?: { once?: boolean }) {
    this.add(listener, opts)
    return () => this.remove(listener)
  }
  emit(data: D) {
    this.listeners.forEach(listener => listener(data))
  }
  length() { return this.listeners.size }
  clear() {
    this.listeners.clear()
    this.wrappedListeners.clear()
  }
}




export type ListenerMap = {
  [ EventName: string ]: any[]
}




export class EventListener<L extends ListenerMap> {

  private listeners = new Map<keyof L, Listener<L[ keyof L ]>>

  subscribe<N extends keyof L>(
    event: N,
    listener: (...data: L[ N ]) => void,
    opts?: { once?: boolean }
  ) {
    let l = this.listeners.get(event)
    if (!l) l = this.listeners.set(event, new Listener).get(event)!
    const handler = (data: L[ keyof L ]) => listener(...data as L[ N ])
    l.add(handler, opts)
    return () => {
      l.remove(handler)
    }
  }

  emit<N extends keyof L>(name: N, ...data: L[ N ]) {
    this.listeners.get(name)?.emit(data)
  }

  clear() {
    this.listeners.forEach((val) => val.clear())
    this.listeners.clear()
  }
  length(name: keyof L) {
    return this.listeners.get(name)?.length() ?? 0
  }

  readonly $Map = {} as L
}