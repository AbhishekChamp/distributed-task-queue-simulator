import { create } from 'zustand'
import type {
  SimulationConfig,
  SimulationMetrics,
  MetricsHistoryPoint,
  Task,
  Worker,
  SimulationEvent,
  WorkerUtilization,
  BottleneckStage,
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
  workerUtilization: WorkerUtilization[]
  bottleneck: BottleneckStage
}

export const useSimulationStore = create<SimulationStoreState>(() => ({
  isRunning: false,
  config: {
    workerCount: 4,
    failureProbability: 10,
    maxRetries: 3,
    simulationSpeed: 1,
    baseProcessingTime: 1000,
    maxQueueCapacity: 200,
    loadBalancingStrategy: 'round-robin',
    enableCircuitBreaker: true,
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
    p50Latency: 0,
    p95Latency: 0,
    p99Latency: 0,
  },
  metricsHistory: [],
  workerUtilization: [],
  bottleneck: 'none',
}))

export function setSimulationState(state: Partial<SimulationStoreState>): void {
  useSimulationStore.setState(state)
}
