import { create } from 'zustand'
import type {
  SimulationConfig,
  SimulationMetrics,
  MetricsHistoryPoint,
  Task,
  Worker,
  SimulationEvent,
} from '../types'

export interface SimulationStoreState {
  isRunning: boolean
  config: SimulationConfig
  tasks: Map<string, Task>
  workers: Worker[]
  mainQueue: string[]
  retryQueue: string[]
  deadLetterQueue: string[]
  events: SimulationEvent[]
  metrics: SimulationMetrics
  metricsHistory: MetricsHistoryPoint[]
}

export const useSimulationStore = create<SimulationStoreState>(() => ({
  isRunning: false,
  config: {
    workerCount: 4,
    failureProbability: 10,
    maxRetries: 3,
    simulationSpeed: 1,
    baseProcessingTime: 1000,
  },
  tasks: new Map(),
  workers: [],
  mainQueue: [],
  retryQueue: [],
  deadLetterQueue: [],
  events: [],
  metrics: {
    queued: 0,
    processing: 0,
    success: 0,
    failed: 0,
    retry: 0,
    dead: 0,
    activeWorkers: 0,
    tasksPerSecond: 0,
    failureRate: 0,
  },
  metricsHistory: [],
}))

export function setSimulationState(state: Partial<SimulationStoreState>): void {
  useSimulationStore.setState(state)
}
