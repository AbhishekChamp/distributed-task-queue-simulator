import type { Task, Worker, SimulationConfig, SimulationEvent } from '../types'
import { EventBus } from './eventBus'
import { TaskQueue } from './queue'
import { processTask } from './worker'
import { createTask } from './task'

export class Scheduler {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private tasks: Map<string, Task>
  private workers: Worker[]
  private mainQueue: TaskQueue
  private retryQueue: TaskQueue
  private deadLetterQueue: TaskQueue
  private config: SimulationConfig
  private eventBus: EventBus
  private tasksProcessedLastSecond = 0
  private lastTick = Date.now()
  private lastWorkerIndex = -1

  constructor(
    tasks: Map<string, Task>,
    workers: Worker[],
    mainQueue: TaskQueue,
    retryQueue: TaskQueue,
    deadLetterQueue: TaskQueue,
    config: SimulationConfig,
    eventBus: EventBus,
  ) {
    this.tasks = tasks
    this.workers = workers
    this.mainQueue = mainQueue
    this.retryQueue = retryQueue
    this.deadLetterQueue = deadLetterQueue
    this.config = config
    this.eventBus = eventBus
  }

  start(): void {
    if (this.intervalId !== null) return
    this.intervalId = setInterval(() => this.tick(), 100)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  step(): void {
    this.tick()
  }

  private tick(): void {
    this.recoverWorkers()
    this.processRetryQueue()
    this.assignTasks()
    this.updateMetrics()
    this.checkIdleState()
  }

  private recoverWorkers(): void {
    const now = Date.now()
    for (const worker of this.workers) {
      if (!worker.healthy && now >= worker.cooldownUntil) {
        worker.healthy = true
        worker.consecutiveFailures = 0
        this.emit({
          type: 'WORKER_HEALTHY',
          timestamp: now,
          workerId: worker.id,
        })
      }
    }
  }

  private processRetryQueue(): void {
    const now = Date.now()
    for (const taskId of this.retryQueue.all) {
      const delay = this.retryQueue.getRetryDelay(taskId)
      if (delay && now >= delay) {
        this.retryQueue.remove(taskId)
        this.retryQueue.clearRetryDelay(taskId)
        const task = this.tasks.get(taskId)
        if (task) {
          task.status = 'queued'
          this.mainQueue.enqueue(taskId, task.priority)
        }
      }
    }
  }

  private assignTasks(): void {
    let idleWorkers = this.workers.filter((w) => !w.busy && w.healthy)
    if (idleWorkers.length === 0 || this.mainQueue.size === 0) return

    const strategy = this.config.loadBalancingStrategy || 'round-robin'

    while (idleWorkers.length > 0 && this.mainQueue.size > 0) {
      let worker: Worker | undefined

      switch (strategy) {
        case 'round-robin': {
          const total = this.workers.length
          let attempts = 0
          while (attempts < total) {
            this.lastWorkerIndex = (this.lastWorkerIndex + 1) % total
            const candidate = this.workers[this.lastWorkerIndex]
            if (!candidate.busy && candidate.healthy) {
              worker = candidate
              break
            }
            attempts++
          }
          break
        }
        case 'least-connections': {
          worker = idleWorkers.sort((a, b) => a.processedCount - b.processedCount)[0]
          break
        }
        case 'random': {
          worker = idleWorkers[Math.floor(Math.random() * idleWorkers.length)]
          break
        }
        default:
          worker = idleWorkers[0]
      }

      if (!worker) break

      const taskId = this.mainQueue.dequeue()
      if (!taskId) break

      const task = this.tasks.get(taskId)
      if (!task) continue

      worker.busy = true
      worker.currentTaskId = taskId
      task.status = 'processing'
      task.startedAt = Date.now()

      this.emit({
        type: 'TASK_STARTED',
        timestamp: Date.now(),
        taskId: task.id,
        workerId: worker.id,
      })

      processTask(task, worker, this.config).then((result) => {
        worker.busy = false
        worker.currentTaskId = undefined
        task.completedAt = Date.now()

        if (result.success) {
          task.status = 'success'
          worker.processedCount += 1
          worker.consecutiveFailures = 0
          this.tasksProcessedLastSecond += 1
          this.emit({
            type: 'TASK_COMPLETED',
            timestamp: Date.now(),
            taskId: task.id,
            workerId: worker.id,
          })
          if (task.batchSize && task.batchSize > 1) {
            this.spawnBatchTasks(task)
          }
        } else {
          task.status = 'failed'
          task.error = result.error
          worker.consecutiveFailures += 1
          this.handleTaskFailure(task, worker)
        }
      })

      idleWorkers = this.workers.filter((w) => !w.busy && w.healthy)
    }
  }

  private spawnBatchTasks(parentTask: Task): void {
    const size = parentTask.batchSize || 1
    for (let i = 0; i < size; i++) {
      const sub = createTask(
        Math.floor(Math.random() * 3),
        this.config.maxRetries,
        this.config.baseProcessingTime,
      )
      sub.parentId = parentTask.id
      this.tasks.set(sub.id, sub)
      this.mainQueue.enqueue(sub.id, sub.priority)
    }
    this.emit({
      type: 'BATCH_SPAWNED',
      timestamp: Date.now(),
      taskId: parentTask.id,
      message: `Spawned ${size} sub-tasks`,
    })
  }

  private handleTaskFailure(task: Task, worker: Worker): void {
    if (this.config.enableCircuitBreaker && worker.consecutiveFailures >= 3 && worker.healthy) {
      worker.healthy = false
      worker.cooldownUntil = Date.now() + 3000
      this.emit({
        type: 'WORKER_UNHEALTHY',
        timestamp: Date.now(),
        workerId: worker.id,
        message: 'Circuit breaker tripped',
      })
    }

    if (task.retryCount < task.maxRetries) {
      task.retryCount += 1
      task.status = 'retry'
      const backoff = Math.pow(2, task.retryCount) * 500
      this.retryQueue.enqueue(task.id, task.priority)
      this.retryQueue.setRetryDelay(task.id, Date.now() + backoff)
      this.emit({
        type: 'TASK_RETRIED',
        timestamp: Date.now(),
        taskId: task.id,
        workerId: worker.id,
        message: `Retry ${task.retryCount}/${task.maxRetries} in ${backoff}ms`,
      })
    } else {
      task.status = 'dead'
      this.deadLetterQueue.enqueue(task.id, task.priority)
      this.emit({
        type: 'TASK_MOVED_TO_DLQ',
        timestamp: Date.now(),
        taskId: task.id,
        workerId: worker.id,
        message: 'Max retries exceeded',
      })
    }

    this.emit({
      type: 'TASK_FAILED',
      timestamp: Date.now(),
      taskId: task.id,
      workerId: worker.id,
      message: task.error,
    })
  }

  private updateMetrics(): void {
    const now = Date.now()
    if (now - this.lastTick >= 1000) {
      this.lastTick = now
      this.tasksProcessedLastSecond = 0
    }
  }

  private checkIdleState(): void {
    const hasWork =
      this.mainQueue.size > 0 || this.retryQueue.size > 0 || this.workers.some((w) => w.busy)
    if (!hasWork && this.tasks.size > 0) {
      this.stop()
      this.emit({
        type: 'ALL_TASKS_COMPLETED',
        timestamp: Date.now(),
      })
    }
  }

  getTasksPerSecond(): number {
    return this.tasksProcessedLastSecond
  }

  private emit(event: SimulationEvent): void {
    this.eventBus.emit(event)
  }
}
