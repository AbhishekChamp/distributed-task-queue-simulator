import type { Worker, Task, SimulationConfig, WorkerProfile } from '../types'

const profileWeights: Record<WorkerProfile, number> = {
  fast: 0.15,
  normal: 0.5,
  slow: 0.25,
  unreliable: 0.1,
}

export function createWorker(id: string): Worker {
  const profiles = Object.keys(profileWeights) as WorkerProfile[]
  const rand = Math.random()
  let cumulative = 0
  let profile: WorkerProfile = 'normal'
  for (const p of profiles) {
    cumulative += profileWeights[p]
    if (rand <= cumulative) {
      profile = p
      break
    }
  }

  return {
    id,
    busy: false,
    processedCount: 0,
    healthy: true,
    cooldownUntil: 0,
    profile,
    consecutiveFailures: 0,
  }
}

function createTokenBucket(maxTps: number) {
  let tokens = maxTps
  let lastRefill = Date.now()
  return {
    consume(): boolean {
      if (maxTps <= 0) return true
      const now = Date.now()
      const elapsed = (now - lastRefill) / 1000
      tokens = Math.min(maxTps, tokens + elapsed * maxTps)
      lastRefill = now
      if (tokens >= 1) {
        tokens -= 1
        return true
      }
      return false
    },
  }
}

const workerBuckets = new Map<string, ReturnType<typeof createTokenBucket>>()

export function resetWorkerBuckets(): void {
  workerBuckets.clear()
}

export function getWorkerBucket(workerId: string, maxTps: number) {
  let bucket = workerBuckets.get(workerId)
  if (!bucket) {
    bucket = createTokenBucket(maxTps)
    workerBuckets.set(workerId, bucket)
  }
  return bucket
}

export async function processTask(
  task: Task,
  worker: Worker,
  config: SimulationConfig,
): Promise<{ success: boolean; error?: string; throttled?: boolean }> {
  const maxTps = config.maxTasksPerSecondPerWorker || 0
  if (maxTps > 0) {
    const bucket = getWorkerBucket(worker.id, maxTps)
    if (!bucket.consume()) {
      await new Promise<void>((resolve) => setTimeout(resolve, 100))
      return { success: false, error: 'Rate limited: too many tasks per second', throttled: true }
    }
  }

  let duration = task.duration / config.simulationSpeed

  switch (worker.profile) {
    case 'fast':
      duration *= 0.6
      break
    case 'slow':
      duration *= 1.5
      break
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, duration)
  })

  let failureProb = config.failureProbability
  if (worker.profile === 'unreliable') {
    failureProb = Math.min(100, failureProb + 20)
  }

  const didFail = Math.random() * 100 < failureProb

  if (didFail) {
    return {
      success: false,
      error: `Simulated failure at worker ${worker.id} (${worker.profile})`,
    }
  }

  return { success: true }
}
