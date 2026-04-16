import type { SimulationConfig } from '../types'
import { SimulationPresets } from './SimulationPresets'
import { PresetGallery } from './PresetGallery'
import { Tooltip } from './Tooltip'

interface ControlPanelProps {
  config: SimulationConfig
  onChange: (config: Partial<SimulationConfig>) => void
  onAddBatch?: (size: number) => void
  snapshotsCount?: number
  rewindTo?: (index: number) => void
  exitRewind?: () => void
  isRewind?: boolean
  isFullscreen?: boolean
  audioConsent?: boolean
  onToggleAudio?: () => void
}

export function ControlPanel({
  config,
  onChange,
  onAddBatch,
  snapshotsCount = 0,
  rewindTo,
  exitRewind,
  isRewind = false,
  isFullscreen = false,
  audioConsent = false,
  onToggleAudio,
}: ControlPanelProps) {
  if (isFullscreen) {
    return (
      <div className="flex flex-col h-full items-center py-2 gap-2">
        <button
          onClick={() => onAddBatch && onAddBatch(10)}
          className="w-10 h-10 rounded-md bg-violet-600 text-white text-xs font-bold flex items-center justify-center"
          title="Batch"
          aria-label="Add batch of 10 sub-tasks"
        >
          B
        </button>
        <div className="w-8 h-px bg-slate-300 dark:bg-slate-700" />
        <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400 text-center">
          <span>W</span>
          <span>{config.workerCount}</span>
        </div>
        <div className="flex flex-col gap-1 text-[9px] text-slate-500 dark:text-slate-400 text-center">
          <span>F</span>
          <span>{config.failureProbability}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
          Controls
        </h2>

        <div className="space-y-4">
          <Tooltip content="Number of workers processing tasks from the queue.">
            <ControlRow label="Workers" value={`${config.workerCount ?? 4}`}>
              <input
                type="range"
                min={1}
                max={20}
                value={config.workerCount ?? 4}
                onChange={(e) => onChange({ workerCount: Number(e.target.value) })}
                className="w-full accent-sky-500"
                aria-label="Worker count"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="Chance (%) that a worker will fail while processing a task.">
            <ControlRow label="Failure Probability" value={`${config.failureProbability ?? 10}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={config.failureProbability ?? 10}
                onChange={(e) => onChange({ failureProbability: Number(e.target.value) })}
                className="w-full accent-rose-500"
                aria-label="Failure probability percent"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="How many times a failed task will be retried before moving to the DLQ.">
            <ControlRow label="Max Retries" value={`${config.maxRetries ?? 3}`}>
              <input
                type="number"
                min={0}
                max={10}
                value={config.maxRetries ?? 3}
                onChange={(e) => onChange({ maxRetries: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
                aria-label="Maximum retries"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="Multiplier for how fast simulated time progresses.">
            <ControlRow label="Simulation Speed" value={`${config.simulationSpeed ?? 1}x`}>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={config.simulationSpeed ?? 1}
                onChange={(e) => onChange({ simulationSpeed: Number(e.target.value) })}
                className="w-full accent-emerald-500"
                aria-label="Simulation speed multiplier"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="Maximum number of tasks the main queue can hold before backpressure drops new tasks.">
            <ControlRow label="Queue Capacity" value={`${config.maxQueueCapacity ?? 200}`}>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={config.maxQueueCapacity ?? 200}
                onChange={(e) => onChange({ maxQueueCapacity: Number(e.target.value) })}
                className="w-full accent-violet-500"
                aria-label="Maximum queue capacity"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="How tasks are distributed across available workers.">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Load Balancing</span>
              </div>
              <select
                value={config.loadBalancingStrategy ?? 'round-robin'}
                onChange={(e) =>
                  onChange({
                    loadBalancingStrategy: e.target
                      .value as SimulationConfig['loadBalancingStrategy'],
                  })
                }
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
                aria-label="Load balancing strategy"
              >
                <option value="round-robin">Round Robin</option>
                <option value="least-connections">Least Connections</option>
                <option value="random">Random</option>
              </select>
            </div>
          </Tooltip>

          <Tooltip content="When enabled, workers that fail 3 times in a row become unhealthy and pause processing for a cooldown period.">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableCircuitBreaker ?? true}
                onChange={(e) => onChange({ enableCircuitBreaker: e.target.checked })}
                className="accent-sky-500"
                aria-label="Enable circuit breaker"
              />
              Enable Circuit Breaker
            </label>
          </Tooltip>

          <Tooltip content="Maximum tasks a worker can process per second. 0 means unlimited.">
            <ControlRow
              label="Max TPS / Worker"
              value={`${config.maxTasksPerSecondPerWorker ?? 0}`}
            >
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={config.maxTasksPerSecondPerWorker ?? 0}
                onChange={(e) => onChange({ maxTasksPerSecondPerWorker: Number(e.target.value) })}
                className="w-full accent-amber-500"
                aria-label="Max tasks per second per worker"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="Probability distribution used to generate task durations.">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Duration Distribution</span>
              </div>
              <select
                value={config.durationDistribution ?? 'uniform'}
                onChange={(e) =>
                  onChange({
                    durationDistribution: e.target
                      .value as SimulationConfig['durationDistribution'],
                  })
                }
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
                aria-label="Duration distribution"
              >
                <option value="uniform">Uniform</option>
                <option value="normal">Normal</option>
                <option value="exponential">Exponential</option>
                <option value="bimodal">Bimodal</option>
              </select>
            </div>
          </Tooltip>

          <Tooltip content="Automatically add or remove workers based on queue depth.">
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enableAutoScaling ?? false}
                onChange={(e) => onChange({ enableAutoScaling: e.target.checked })}
                className="accent-sky-500"
                aria-label="Enable auto-scaling"
              />
              Enable Auto-Scaling
            </label>
          </Tooltip>

          {config.enableAutoScaling && (
            <Tooltip content="Queue depth threshold that triggers auto-scaling up or down.">
              <ControlRow
                label="Scale Threshold"
                value={`${config.autoScalingQueueThreshold ?? 50}`}
              >
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={config.autoScalingQueueThreshold ?? 50}
                  onChange={(e) => onChange({ autoScalingQueueThreshold: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                  aria-label="Auto-scaling queue threshold"
                />
              </ControlRow>
            </Tooltip>
          )}

          {onToggleAudio && (
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={audioConsent ?? false}
                onChange={onToggleAudio}
                className="accent-sky-500"
                aria-label="Enable audio feedback"
              />
              Enable Audio Feedback
            </label>
          )}

          <Tooltip content="Fixed network latency added before a task starts processing.">
            <ControlRow label="Network Latency" value={`${config.networkLatencyMs ?? 0}ms`}>
              <input
                type="range"
                min={0}
                max={1000}
                step={50}
                value={config.networkLatencyMs ?? 0}
                onChange={(e) => onChange({ networkLatencyMs: Number(e.target.value) })}
                className="w-full accent-cyan-500"
                aria-label="Network latency milliseconds"
              />
            </ControlRow>
          </Tooltip>

          <Tooltip content="Random jitter added on top of network latency.">
            <ControlRow label="Jitter" value={`${config.networkJitterMs ?? 0}ms`}>
              <input
                type="range"
                min={0}
                max={500}
                step={25}
                value={config.networkJitterMs ?? 0}
                onChange={(e) => onChange({ networkJitterMs: Number(e.target.value) })}
                className="w-full accent-pink-500"
                aria-label="Network jitter milliseconds"
              />
            </ControlRow>
          </Tooltip>

          {onAddBatch && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => onAddBatch(10)}
                className="w-full px-3 py-2 rounded-md bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-600/30 transition text-sm font-medium"
              >
                Add Batch (10 sub-tasks)
              </button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
            Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>Space</span>
            <span>Play / Pause</span>
            <span>R</span>
            <span>Reset</span>
            <span>1 / 2 / 3 / 4</span>
            <span>Add 1 / 10 / 100 / 1k</span>
          </div>
        </div>

        {snapshotsCount > 0 && rewindTo && exitRewind && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
              Time Travel
            </h3>
            <input
              type="range"
              min={0}
              max={Math.max(0, snapshotsCount - 1)}
              disabled={!isRewind}
              onChange={(e) => rewindTo(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => rewindTo(Math.max(0, snapshotsCount - 1))}
                aria-label="Rewind to last snapshot"
                className="flex-1 px-2 py-1.5 rounded-md bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-600/30 transition"
              >
                Rewind
              </button>
              <button
                onClick={exitRewind}
                aria-label="Return to live simulation"
                className="flex-1 px-2 py-1.5 rounded-md bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition"
              >
                Live
              </button>
            </div>
          </div>
        )}
      </div>

      <SimulationPresets onApply={onChange} />
      <PresetGallery currentConfig={config} onApply={onChange} />
    </div>
  )
}

function ControlRow({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-mono text-slate-800 dark:text-slate-200">{value}</span>
      </div>
      {children}
    </div>
  )
}
