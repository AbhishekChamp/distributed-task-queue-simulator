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
}

export interface Worker {
  id: string
  busy: boolean
  currentTaskId?: string
  processedCount: number
}

export interface SimulationConfig {
  workerCount: number
  failureProbability: number
  maxRetries: number
  simulationSpeed: number
  baseProcessingTime: number
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
  | 'SYSTEM_OVERLOAD'
  | 'ALL_TASKS_COMPLETED'

export interface SimulationEvent {
  type: SimulationEventType
  timestamp: number
  taskId?: string
  workerId?: string
  message?: string
}

export type EventListener = (event: SimulationEvent) => void
