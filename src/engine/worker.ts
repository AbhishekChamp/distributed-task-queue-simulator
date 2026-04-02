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

export async function processTask(
  task: Task,
  worker: Worker,
  config: SimulationConfig,
): Promise<{ success: boolean; error?: string }> {
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
