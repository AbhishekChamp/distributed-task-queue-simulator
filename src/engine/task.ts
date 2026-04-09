import type { Task, DurationDistribution } from '../types'

let taskIdCounter = 0

function randomNormal(mean: number, stdDev: number): number {
  let u = 0
  let v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + z * stdDev
}

function sampleDuration(base: number, distribution: DurationDistribution): number {
  switch (distribution) {
    case 'normal':
      return Math.max(100, randomNormal(base, base * 0.2))
    case 'exponential':
      return Math.max(100, -Math.log(1 - Math.random()) * base)
    case 'bimodal': {
      const mode = Math.random() < 0.5 ? base * 0.5 : base * 1.5
      return Math.max(100, randomNormal(mode, base * 0.15))
    }
    case 'uniform':
    default:
      return base + Math.random() * 500
  }
}

export function createTask(
  priority = 0,
  maxRetries = 3,
  baseDuration = 1000,
  batchSize = 1,
  distribution: DurationDistribution = 'uniform',
): Task {
  taskIdCounter += 1
  const id = `task-${Date.now()}-${taskIdCounter}`
  return {
    id,
    status: 'queued',
    priority,
    retryCount: 0,
    maxRetries,
    createdAt: Date.now(),
    duration: sampleDuration(baseDuration, distribution),
    batchSize,
  }
}

export function generateTasks(
  count: number,
  maxRetries: number,
  baseDuration: number,
  batchSize = 1,
  distribution: DurationDistribution = 'uniform',
): Task[] {
  return Array.from({ length: count }, () =>
    createTask(Math.floor(Math.random() * 3), maxRetries, baseDuration, batchSize, distribution),
  )
}
