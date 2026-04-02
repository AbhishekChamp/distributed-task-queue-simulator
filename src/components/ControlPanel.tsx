import type { SimulationConfig } from '../types'
import { SimulationPresets } from './SimulationPresets'

interface ControlPanelProps {
  config: SimulationConfig
  onChange: (config: Partial<SimulationConfig>) => void
}

export function ControlPanel({ config, onChange }: ControlPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
          Controls
        </h2>

        <div className="space-y-4">
          <ControlRow label="Workers" value={`${config.workerCount}`}>
            <input
              type="range"
              min={1}
              max={20}
              value={config.workerCount}
              onChange={(e) => onChange({ workerCount: Number(e.target.value) })}
              className="w-full accent-sky-500"
            />
          </ControlRow>

          <ControlRow label="Failure Probability" value={`${config.failureProbability}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={config.failureProbability}
              onChange={(e) => onChange({ failureProbability: Number(e.target.value) })}
              className="w-full accent-rose-500"
            />
          </ControlRow>

          <ControlRow label="Max Retries" value={`${config.maxRetries}`}>
            <input
              type="number"
              min={0}
              max={10}
              value={config.maxRetries}
              onChange={(e) => onChange({ maxRetries: Number(e.target.value) })}
              className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-sm text-slate-800 dark:text-slate-200"
            />
          </ControlRow>

          <ControlRow label="Simulation Speed" value={`${config.simulationSpeed}x`}>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={config.simulationSpeed}
              onChange={(e) => onChange({ simulationSpeed: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </ControlRow>
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
      </div>

      <SimulationPresets onApply={onChange} />
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
