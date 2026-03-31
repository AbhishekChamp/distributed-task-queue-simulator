import type { Worker, Task, SimulationConfig } from '../types'

export function createWorker(id: string): Worker {
  return {
    id,
    busy: false,
    processedCount: 0,
  }
}

export async function processTask(
  task: Task,
  worker: Worker,
  config: SimulationConfig,
): Promise<{ success: boolean; error?: string }> {
  const actualDuration = task.duration / config.simulationSpeed

  await new Promise<void>((resolve) => {
    setTimeout(resolve, actualDuration)
  })

  const didFail = Math.random() * 100 < config.failureProbability

  if (didFail) {
    return {
      success: false,
      error: `Simulated failure at worker ${worker.id}`,
    }
  }

  return { success: true }
}
