import type { SimulationConfig, Task, SimulationEvent, MetricsHistoryPoint } from '../types'
import { EventBus } from './eventBus'
import { TaskQueue } from './queue'
import { createWorker } from './worker'
import { Scheduler } from './scheduler'
import { generateTasks } from './task'

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
  private metricsIntervalId: number | null = null

  constructor(config?: Partial<SimulationConfig>) {
    this.config = {
      workerCount: 4,
      failureProbability: 10,
      maxRetries: 3,
      simulationSpeed: 1,
      baseProcessingTime: 1000,
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
  }

  private startMetricsSampling(): void {
    if (this.metricsIntervalId !== null) return
    this.metricsIntervalId = window.setInterval(() => {
      const metrics = this.computeMetrics()
      this.metricsHistory.push({ ...metrics, timestamp: Date.now() })
      if (this.metricsHistory.length > this.maxMetricsHistory) {
        this.metricsHistory.shift()
      }
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

  reset(): void {
    this.pause()
    this.tasks.clear()
    this.mainQueue = new TaskQueue()
    this.retryQueue = new TaskQueue()
    this.deadLetterQueue = new TaskQueue()
    this.eventHistory = []
    this.metricsHistory = []
    this.workers.forEach((w) => {
      w.busy = false
      w.currentTaskId = undefined
      w.processedCount = 0
    })
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

  addTask(count = 1): void {
    const newTasks = generateTasks(count, this.config.maxRetries, this.config.baseProcessingTime)
    for (const task of newTasks) {
      this.tasks.set(task.id, task)
      this.mainQueue.enqueue(task.id, task.priority)
      this.eventBus.emit({
        type: 'TASK_CREATED',
        timestamp: Date.now(),
        taskId: task.id,
      })
    }

    if (this.isRunning && this.mainQueue.size > this.workers.length * 5) {
      this.eventBus.emit({
        type: 'SYSTEM_OVERLOAD',
        timestamp: Date.now(),
        message: `Queue depth reached ${this.mainQueue.size}`,
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
    }
  }

  onEvent(listener: (event: SimulationEvent) => void): () => void {
    return this.eventBus.on('*', listener)
  }
}
