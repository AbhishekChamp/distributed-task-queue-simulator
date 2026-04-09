import type {
  SimulationConfig,
  Task,
  SimulationEvent,
  MetricsHistoryPoint,
  WorkerUtilization,
  BottleneckStage,
} from '../types'
import { EventBus } from './eventBus'
import { TaskQueue } from './queue'
import { createWorker, resetWorkerBuckets } from './worker'
import { Scheduler } from './scheduler'
import { generateTasks, createTask } from './task'

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil(sorted.length * p) - 1
  return sorted[Math.max(0, idx)]
}

export class SimulationEngine {
  private eventBus: EventBus
  private tasks: Map<string, Task> = new Map()
  private workers = Array.from({ length: 4 }, (_, i) => createWorker(`worker-${i + 1}`))
  private mainQueue = new TaskQueue()
  private retryQueue = new TaskQueue()
  private deadLetterQueue = new TaskQueue()
  private scheduler: Scheduler
  private config: SimulationConfig
  private isRunning = false
  private eventHistory: SimulationEvent[] = []
  private maxHistory = 200
  private metricsHistory: MetricsHistoryPoint[] = []
  private maxMetricsHistory = 300
  private metricsIntervalId: ReturnType<typeof setInterval> | null = null
  private workerUtilization: WorkerUtilization[] = []
  private utilizationIntervalId: ReturnType<typeof setInterval> | null = null

  constructor(config?: Partial<SimulationConfig>) {
    this.config = {
      workerCount: 4,
      failureProbability: 10,
      maxRetries: 3,
      simulationSpeed: 1,
      baseProcessingTime: 1000,
      maxQueueCapacity: 200,
      loadBalancingStrategy: 'round-robin',
      enableCircuitBreaker: true,
      maxTasksPerSecondPerWorker: 0,
      durationDistribution: 'uniform',
      enableAutoScaling: false,
      autoScalingQueueThreshold: 50,
      ...config,
    }

    this.eventBus = new EventBus()
    this.scheduler = new Scheduler(
      this.tasks,
      this.workers,
      this.mainQueue,
      this.retryQueue,
      this.deadLetterQueue,
      this.config,
      this.eventBus,
    )

    this.eventBus.on('*', (event) => {
      this.eventHistory.push(event)
      if (this.eventHistory.length > this.maxHistory) {
        this.eventHistory.shift()
      }
      if (event.type === 'ALL_TASKS_COMPLETED') {
        this.isRunning = false
      }
    })

    this.updateWorkers()
    this.startMetricsSampling()
    this.startUtilizationSampling()
  }

  private startMetricsSampling(): void {
    if (this.metricsIntervalId !== null) return
    this.metricsIntervalId = setInterval(() => {
      const metrics = this.computeMetrics()
      this.metricsHistory.push({ ...metrics, timestamp: Date.now() })
      if (this.metricsHistory.length > this.maxMetricsHistory) {
        this.metricsHistory.shift()
      }
    }, 500)
  }

  private startUtilizationSampling(): void {
    if (this.utilizationIntervalId !== null) return
    this.utilizationIntervalId = setInterval(() => {
      this.workers.forEach((worker) => {
        let entry = this.workerUtilization.find((u) => u.workerId === worker.id)
        if (!entry) {
          entry = { workerId: worker.id, history: [] }
          this.workerUtilization.push(entry)
        }
        const status = worker.healthy ? (worker.busy ? 'busy' : 'idle') : 'unhealthy'
        entry.history.push(status)
        if (entry.history.length > 60) {
          entry.history.shift()
        }
      })
    }, 500)
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.scheduler.start()
  }

  pause(): void {
    this.isRunning = false
    this.scheduler.stop()
  }

  step(): void {
    if (!this.isRunning) {
      this.scheduler.step()
    }
  }

  reset(): void {
    this.pause()
    this.tasks.clear()
    this.mainQueue = new TaskQueue()
    this.retryQueue = new TaskQueue()
    this.deadLetterQueue = new TaskQueue()
    this.eventHistory = []
    this.metricsHistory = []
    this.workerUtilization = []
    resetWorkerBuckets()
    this.workers = Array.from({ length: this.config.workerCount }, (_, i) =>
      createWorker(`worker-${i + 1}`),
    )
    this.scheduler = new Scheduler(
      this.tasks,
      this.workers,
      this.mainQueue,
      this.retryQueue,
      this.deadLetterQueue,
      this.config,
      this.eventBus,
    )
  }

  addTask(count = 1): number {
    const capacity = this.config.maxQueueCapacity
    const available = Math.max(0, capacity - this.mainQueue.size)
    const toAdd = Math.min(count, available)

    if (toAdd > 0) {
      const newTasks = generateTasks(
        toAdd,
        this.config.maxRetries,
        this.config.baseProcessingTime,
        1,
        this.config.durationDistribution,
      )
      for (const task of newTasks) {
        this.tasks.set(task.id, task)
        this.mainQueue.enqueue(task.id, task.priority)
        this.eventBus.emit({
          type: 'TASK_CREATED',
          timestamp: Date.now(),
          taskId: task.id,
        })
      }
    }

    if (count > available) {
      this.eventBus.emit({
        type: 'BACKPRESSURE_APPLIED',
        timestamp: Date.now(),
        message: `Dropped ${count - available} tasks (capacity ${capacity})`,
      })
    }

    if (this.isRunning && this.mainQueue.size > this.workers.length * 5) {
      this.eventBus.emit({
        type: 'SYSTEM_OVERLOAD',
        timestamp: Date.now(),
        message: `Queue depth reached ${this.mainQueue.size}`,
      })
    }

    return toAdd
  }

  addBatch(batchSize: number): void {
    const task = createTask(
      Math.floor(Math.random() * 3),
      this.config.maxRetries,
      this.config.baseProcessingTime,
      batchSize,
      this.config.durationDistribution,
    )
    if (this.mainQueue.size < this.config.maxQueueCapacity) {
      this.tasks.set(task.id, task)
      this.mainQueue.enqueue(task.id, task.priority)
      this.eventBus.emit({
        type: 'TASK_CREATED',
        timestamp: Date.now(),
        taskId: task.id,
        message: `Batch job with ${batchSize} sub-tasks`,
      })
    } else {
      this.eventBus.emit({
        type: 'BACKPRESSURE_APPLIED',
        timestamp: Date.now(),
        message: 'Batch rejected: queue at capacity',
      })
    }
  }

  updateConfig(newConfig: Partial<SimulationConfig>): void {
    Object.assign(this.config, newConfig)
    if (newConfig.workerCount !== undefined) {
      this.updateWorkers()
    }
    this.scheduler = new Scheduler(
      this.tasks,
      this.workers,
      this.mainQueue,
      this.retryQueue,
      this.deadLetterQueue,
      this.config,
      this.eventBus,
    )
    if (this.isRunning) {
      this.scheduler.start()
    }
  }

  private updateWorkers(): void {
    const current = this.workers.length
    const target = this.config.workerCount
    if (target > current) {
      for (let i = current; i < target; i++) {
        this.workers.push(createWorker(`worker-${i + 1}`))
      }
    } else if (target < current) {
      this.workers.splice(target)
    }
  }

  private detectBottleneck(): BottleneckStage {
    const busyWorkers = this.workers.filter((w) => w.busy).length
    const totalWorkers = this.workers.length
    const queueDepth = this.mainQueue.size
    const retryDepth = this.retryQueue.size

    if (queueDepth >= this.config.maxQueueCapacity * 0.9) {
      return 'queue'
    }
    if (queueDepth > 0 && busyWorkers === totalWorkers && retryDepth < 5) {
      return 'workers'
    }
    if (queueDepth === 0 && busyWorkers === 0 && this.tasks.size > 0) {
      return 'none'
    }
    if (queueDepth > totalWorkers * 3) {
      return 'queue'
    }
    return 'none'
  }

  getState() {
    return {
      isRunning: this.isRunning,
      config: { ...this.config },
      tasks: new Map(this.tasks),
      workers: [...this.workers],
      mainQueue: this.mainQueue.all,
      retryQueue: this.retryQueue.all,
      deadLetterQueue: this.deadLetterQueue.all,
      events: [...this.eventHistory],
      metrics: this.computeMetrics(),
      metricsHistory: [...this.metricsHistory],
      workerUtilization: this.workerUtilization.map((u) => ({ ...u, history: [...u.history] })),
      bottleneck: this.detectBottleneck(),
    }
  }

  private computeMetrics() {
    const all = Array.from(this.tasks.values())
    const queued = all.filter((t) => t.status === 'queued').length
    const processing = all.filter((t) => t.status === 'processing').length
    const success = all.filter((t) => t.status === 'success').length
    const failed = all.filter((t) => t.status === 'failed').length
    const retry = all.filter((t) => t.status === 'retry').length
    const dead = all.filter((t) => t.status === 'dead').length
    const activeWorkers = this.workers.filter((w) => w.busy).length
    const totalCompleted = success + dead
    const failureRate = totalCompleted > 0 ? (dead / totalCompleted) * 100 : 0

    const completedDurations = all
      .filter((t) => t.status === 'success' || t.status === 'dead')
      .map((t) => (t.completedAt || 0) - (t.startedAt || t.createdAt))
      .sort((a, b) => a - b)

    return {
      queued,
      processing,
      success,
      failed,
      retry,
      dead,
      activeWorkers,
      tasksPerSecond: this.scheduler.getTasksPerSecond(),
      failureRate: Math.round(failureRate * 100) / 100,
      p50Latency: percentile(completedDurations, 0.5),
      p95Latency: percentile(completedDurations, 0.95),
      p99Latency: percentile(completedDurations, 0.99),
    }
  }

  onEvent(listener: (event: SimulationEvent) => void): () => void {
    return this.eventBus.on('*', listener)
  }
}
