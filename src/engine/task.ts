import type { Task } from '../types'

let taskIdCounter = 0

export function createTask(priority = 0, maxRetries = 3, baseDuration = 1000): Task {
  taskIdCounter += 1
  const id = `task-${Date.now()}-${taskIdCounter}`
  return {
    id,
    status: 'queued',
    priority,
    retryCount: 0,
    maxRetries,
    createdAt: Date.now(),
    duration: baseDuration + Math.random() * 500,
  }
}

export function generateTasks(count: number, maxRetries: number, baseDuration: number): Task[] {
  return Array.from({ length: count }, () =>
    createTask(Math.floor(Math.random() * 3), maxRetries, baseDuration),
  )
}
