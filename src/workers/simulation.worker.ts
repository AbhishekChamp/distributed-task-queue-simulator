import { SimulationEngine } from '../engine/simulation'
import type { SimulationEvent } from '../types'

let engine: SimulationEngine | null = null
let intervalId: ReturnType<typeof setInterval> | null = null

function broadcastState() {
  if (!engine) return
  const state = engine.getState()
  self.postMessage({ type: 'STATE', state })
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data
  switch (type) {
    case 'INIT': {
      engine = new SimulationEngine(payload?.config)
      engine.onEvent((event: SimulationEvent) => {
        self.postMessage({ type: 'EVENT', event })
      })
      if (intervalId) clearInterval(intervalId)
      intervalId = setInterval(broadcastState, 100)
      break
    }
    case 'START': {
      engine?.start()
      broadcastState()
      break
    }
    case 'PAUSE': {
      engine?.pause()
      broadcastState()
      break
    }
    case 'RESET': {
      engine?.reset()
      broadcastState()
      break
    }
    case 'ADD_TASKS': {
      engine?.addTask(payload?.count)
      break
    }
    case 'ADD_BATCH': {
      engine?.addBatch(payload?.batchSize)
      break
    }
    case 'UPDATE_CONFIG': {
      engine?.updateConfig(payload?.config)
      broadcastState()
      break
    }
    case 'STEP': {
      engine?.step()
      broadcastState()
      break
    }
  }
}
