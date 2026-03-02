import { Listener } from "./util-listener"

export class Store<Data> {
  private listeners = new Listener<Data>
  
  constructor(public data: Data) { }

  subscribe(listener: (data: Data) => void) {
    return this.listeners.subscribe(listener)
  }
  get() {
    return this.data
  }
  update(data: Data) {
    this.data = data
    this.listeners.emit(data)
  }

}
