import type { Task, Worker, SimulationConfig, SimulationEvent } from '../types'
import { EventBus } from './eventBus'
import { TaskQueue } from './queue'
import { processTask } from './worker'

export class Scheduler {
  private intervalId: number | null = null
  private tasks: Map<string, Task>
  private workers: Worker[]
  private mainQueue: TaskQueue
  private retryQueue: TaskQueue
  private deadLetterQueue: TaskQueue
  private config: SimulationConfig
  private eventBus: EventBus
  private tasksProcessedLastSecond = 0
  private lastTick = Date.now()

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
    this.intervalId = window.setInterval(() => this.tick(), 100)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private tick(): void {
    this.processRetryQueue()
    this.assignTasks()
    this.updateMetrics()
    this.checkIdleState()
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
    const idleWorkers = this.workers.filter((w) => !w.busy)
    if (idleWorkers.length === 0 || this.mainQueue.size === 0) return

    for (const worker of idleWorkers) {
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
          this.tasksProcessedLastSecond += 1
          this.emit({
            type: 'TASK_COMPLETED',
            timestamp: Date.now(),
            taskId: task.id,
            workerId: worker.id,
          })
        } else {
          task.status = 'failed'
          task.error = result.error
          this.handleTaskFailure(task, worker)
        }
      })
    }
  }

  private handleTaskFailure(task: Task, worker: Worker): void {
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

  getTasksPerSecond(): number {
    return this.tasksProcessedLastSecond
  }

  private emit(event: SimulationEvent): void {
    this.eventBus.emit(event)
  }
}
