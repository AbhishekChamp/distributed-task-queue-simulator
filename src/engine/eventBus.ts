import type { SimulationEvent, EventListener } from '../types'

export class EventBus {
  private listeners: Map<string, EventListener[]> = new Map()

  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(listener)

    return () => {
      const list = this.listeners.get(eventType)
      if (list) {
        const idx = list.indexOf(listener)
        if (idx > -1) list.splice(idx, 1)
      }
    }
  }

  emit(event: SimulationEvent): void {
    const list = this.listeners.get(event.type)
    if (list) {
      list.forEach((listener) => listener(event))
    }
    const allList = this.listeners.get('*')
    if (allList) {
      allList.forEach((listener) => listener(event))
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}

export const eventBus = new EventBus()
