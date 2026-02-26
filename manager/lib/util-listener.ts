export class Listener<Data>{
  private listeners = new Set<(data: Data) => void>()

  add(listener: (data: Data) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  remove(listener: (data: Data) => void) {
    this.listeners.delete(listener)
  }

  emit(data: Data) {
    this.listeners.forEach(listener => listener(data))
  }

  length() {
    return this.listeners.size
  }

  clear() {
    this.listeners.clear()
  }
}