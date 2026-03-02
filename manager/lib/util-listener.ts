export class Listener<Data> {

  private listeners = new Set<(data: Data) => void>()

  add(listener: (data: Data) => void) {
    this.listeners.add(listener)
  }
  subscribe(listener: (data: Data) => void) {
    this.add(listener)
    return () => this.remove(listener)
  }
  remove(listener: (data: Data) => void) {
    this.listeners.delete(listener)
  }

  emit(data: Data) {
    this.listeners.forEach(listener => listener(data))
  }

  length() { return this.listeners.size }
  clear() { this.listeners.clear() }
}




export type ListenerMap = {
  [ EventName: string ]: any[]
}




export class EventListener<L extends ListenerMap> {

  private listeners = new Map<keyof L, Listener<L[ keyof L ]>>

  subscribe<N extends keyof L>(event: N, listener: (...data: L[ N ]) => void) {
    let l = this.listeners.get(event)
    if (!l) l = this.listeners.set(event, new Listener).get(event)!
    const handler = (data: L[ keyof L ]) => listener(...data as L[ N ])
    l.add(handler)
    return () => l.remove(handler)
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