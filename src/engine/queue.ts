export class TaskQueue {
  private tasks: string[] = []
  private retryDelays: Map<string, number> = new Map()

  enqueue(taskId: string, priority = 0): void {
    if (priority > 0) {
      const idx = this.tasks.findIndex((id) => {
        return (this.priorities.get(id) ?? 0) < priority
      })
      if (idx === -1) {
        this.tasks.push(taskId)
      } else {
        this.tasks.splice(idx, 0, taskId)
      }
    } else {
      this.tasks.push(taskId)
    }
    this.priorities.set(taskId, priority)
  }

  private priorities: Map<string, number> = new Map()

  dequeue(): string | undefined {
    const id = this.tasks.shift()
    if (id) this.priorities.delete(id)
    return id
  }

  peek(): string | undefined {
    return this.tasks[0]
  }

  remove(taskId: string): boolean {
    const idx = this.tasks.indexOf(taskId)
    if (idx > -1) {
      this.tasks.splice(idx, 1)
      this.priorities.delete(taskId)
      return true
    }
    return false
  }

  get size(): number {
    return this.tasks.length
  }

  get all(): string[] {
    return [...this.tasks]
  }

  setRetryDelay(taskId: string, delay: number): void {
    this.retryDelays.set(taskId, Date.now() + delay)
  }

  getRetryDelay(taskId: string): number | undefined {
    return this.retryDelays.get(taskId)
  }

  clearRetryDelay(taskId: string): void {
    this.retryDelays.delete(taskId)
  }
}
