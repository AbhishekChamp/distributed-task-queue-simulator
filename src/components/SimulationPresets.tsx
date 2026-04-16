import type { SimulationConfig } from '../types'

interface SimulationPresetsProps {
  onApply: (config: SimulationConfig) => void
}

const presets: { label: string; config: SimulationConfig; color: string }[] = [
  {
    label: 'Steady State',
    config: {
      workerCount: 4,
      failureProbability: 5,
      maxRetries: 2,
      simulationSpeed: 1,
      baseProcessingTime: 800,
      maxQueueCapacity: 200,
      loadBalancingStrategy: 'round-robin',
      enableCircuitBreaker: true,
      maxTasksPerSecondPerWorker: 0,
      durationDistribution: 'uniform',
      enableAutoScaling: false,
      autoScalingQueueThreshold: 50,
      networkLatencyMs: 0,
      networkJitterMs: 0,
    },
    color:
      'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-600/30',
  },
  {
    label: 'Chaos Mode',
    config: {
      workerCount: 6,
      failureProbability: 60,
      maxRetries: 5,
      simulationSpeed: 2,
      baseProcessingTime: 500,
      maxQueueCapacity: 300,
      loadBalancingStrategy: 'random',
      enableCircuitBreaker: true,
      maxTasksPerSecondPerWorker: 0,
      durationDistribution: 'exponential',
      enableAutoScaling: false,
      autoScalingQueueThreshold: 50,
      networkLatencyMs: 0,
      networkJitterMs: 0,
    },
    color:
      'bg-rose-100 dark:bg-rose-600/20 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-600/30',
  },
  {
    label: 'Traffic Spike',
    config: {
      workerCount: 2,
      failureProbability: 15,
      maxRetries: 3,
      simulationSpeed: 3,
      baseProcessingTime: 1200,
      maxQueueCapacity: 100,
      loadBalancingStrategy: 'least-connections',
      enableCircuitBreaker: true,
      maxTasksPerSecondPerWorker: 0,
      durationDistribution: 'normal',
      enableAutoScaling: true,
      autoScalingQueueThreshold: 40,
      networkLatencyMs: 0,
      networkJitterMs: 0,
    },
    color:
      'bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-600/30',
  },
  {
    label: 'Zero Failure',
    config: {
      workerCount: 8,
      failureProbability: 0,
      maxRetries: 0,
      simulationSpeed: 2,
      baseProcessingTime: 400,
      maxQueueCapacity: 500,
      loadBalancingStrategy: 'round-robin',
      enableCircuitBreaker: false,
      maxTasksPerSecondPerWorker: 0,
      durationDistribution: 'uniform',
      enableAutoScaling: false,
      autoScalingQueueThreshold: 50,
      networkLatencyMs: 0,
      networkJitterMs: 0,
    },
    color:
      'bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-600/30',
  },
]

export function SimulationPresets({ onApply }: SimulationPresetsProps) {
  return (
    <div className="p-4 border-t border-slate-200 dark:border-slate-800">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-3">
        Presets
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => onApply(p.config)}
            className={`px-2 py-1.5 rounded text-xs font-medium transition ${p.color}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
