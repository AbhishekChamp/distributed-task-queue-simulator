export type TaskStatus = 'queued' | 'processing' | 'success' | 'failed' | 'retry' | 'dead'

export interface Task {
  id: string
  status: TaskStatus
  priority: number
  retryCount: number
  maxRetries: number
  createdAt: number
  startedAt?: number
  completedAt?: number
  duration: number
  error?: string
  batchSize?: number
  parentId?: string
}

export type WorkerProfile = 'fast' | 'normal' | 'slow' | 'unreliable'

export interface Worker {
  id: string
  busy: boolean
  currentTaskId?: string
  processedCount: number
  healthy: boolean
  cooldownUntil: number
  profile: WorkerProfile
  consecutiveFailures: number
}

export type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'random'

export interface SimulationConfig {
  workerCount: number
  failureProbability: number
  maxRetries: number
  simulationSpeed: number
  baseProcessingTime: number
  maxQueueCapacity: number
  loadBalancingStrategy: LoadBalancingStrategy
  enableCircuitBreaker: boolean
}

export interface SimulationMetrics {
  queued: number
  processing: number
  success: number
  failed: number
  retry: number
  dead: number
  activeWorkers: number
  tasksPerSecond: number
  failureRate: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
}

export interface MetricsHistoryPoint extends SimulationMetrics {
  timestamp: number
}

export interface SimulationState {
  isRunning: boolean
  config: SimulationConfig
  tasks: Map<string, Task>
  workers: Worker[]
  mainQueue: string[]
  retryQueue: string[]
  deadLetterQueue: string[]
  metrics: SimulationMetrics
  metricsHistory: MetricsHistoryPoint[]
  events: SimulationEvent[]
}

export type SimulationEventType =
  | 'TASK_CREATED'
  | 'TASK_STARTED'
  | 'TASK_COMPLETED'
  | 'TASK_FAILED'
  | 'TASK_RETRIED'
  | 'TASK_MOVED_TO_DLQ'
  | 'WORKER_STARTED'
  | 'WORKER_IDLE'
  | 'WORKER_HEALTHY'
  | 'WORKER_UNHEALTHY'
  | 'SYSTEM_OVERLOAD'
  | 'BACKPRESSURE_APPLIED'
  | 'BATCH_SPAWNED'
  | 'ALL_TASKS_COMPLETED'

export interface SimulationEvent {
  type: SimulationEventType
  timestamp: number
  taskId?: string
  workerId?: string
  message?: string
}

export type EventListener = (event: SimulationEvent) => void

export interface SimulationPreset {
  name: string
  description: string
  config: SimulationConfig
}
