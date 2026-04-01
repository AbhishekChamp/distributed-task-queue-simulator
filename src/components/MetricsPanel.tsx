import type { SimulationMetrics } from '../types'

interface MetricsPanelProps {
  metrics: SimulationMetrics
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const items = [
    { label: 'Queue Depth', value: metrics.queued, color: 'text-sky-600 dark:text-sky-400' },
    { label: 'Processing', value: metrics.processing, color: 'text-amber-600 dark:text-amber-400' },
    {
      label: 'Active Workers',
      value: metrics.activeWorkers,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Tasks / sec',
      value: metrics.tasksPerSecond,
      color: 'text-violet-600 dark:text-violet-400',
    },
    { label: 'Success', value: metrics.success, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Failed', value: metrics.failed, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Retrying', value: metrics.retry, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'DLQ', value: metrics.dead, color: 'text-slate-500 dark:text-slate-400' },
    {
      label: 'Failure Rate',
      value: `${metrics.failureRate}%`,
      color: 'text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Metrics
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 px-3 py-2"
          >
            <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
            <span className={`font-mono text-lg font-semibold ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
