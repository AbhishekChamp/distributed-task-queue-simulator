import type { SimulationMetrics, MetricsHistoryPoint, WorkerUtilization } from '../types'
import { Sparkline } from './Sparkline'

interface MetricsPanelProps {
  metrics: SimulationMetrics
  metricsHistory: MetricsHistoryPoint[]
  workerUtilization: WorkerUtilization[]
  onExport: () => void
  onImport: (file: File) => void
}

export function MetricsPanel({
  metrics,
  metricsHistory,
  workerUtilization,
  onExport,
  onImport,
}: MetricsPanelProps) {
  const items: {
    label: string
    value: number | string
    color: string
    historyKey: keyof SimulationMetrics
  }[] = [
    { label: 'Queue Depth', value: metrics.queued, color: '#0ea5e9', historyKey: 'queued' },
    { label: 'Processing', value: metrics.processing, color: '#f59e0b', historyKey: 'processing' },
    {
      label: 'Active Workers',
      value: metrics.activeWorkers,
      color: '#10b981',
      historyKey: 'activeWorkers',
    },
    {
      label: 'Tasks / sec',
      value: metrics.tasksPerSecond,
      color: '#8b5cf6',
      historyKey: 'tasksPerSecond',
    },
    { label: 'Success', value: metrics.success, color: '#10b981', historyKey: 'success' },
    { label: 'Failed', value: metrics.failed, color: '#f43f5e', historyKey: 'failed' },
    { label: 'Retrying', value: metrics.retry, color: '#f59e0b', historyKey: 'retry' },
    { label: 'DLQ', value: metrics.dead, color: '#64748b', historyKey: 'dead' },
    {
      label: 'Failure Rate',
      value: `${metrics.failureRate}%`,
      color: '#f43f5e',
      historyKey: 'failureRate',
    },
  ]

  const latencies = [
    { label: 'p50 Latency', value: `${metrics.p50Latency}ms`, color: '#38bdf8' },
    { label: 'p95 Latency', value: `${metrics.p95Latency}ms`, color: '#a855f7' },
    { label: 'p99 Latency', value: `${metrics.p99Latency}ms`, color: '#f43f5e' },
  ]

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Metrics
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => {
          const history = metricsHistory.map((m) => m[item.historyKey] as number)
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 px-3 py-2"
            >
              <div className="flex flex-col">
                <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                <span className="font-mono text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {item.value}
                </span>
              </div>
              <Sparkline
                data={history.length > 1 ? history : [0, 0]}
                width={80}
                height={28}
                color={item.color}
              />
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
          Latency Percentiles
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {latencies.map((l) => (
            <div
              key={l.label}
              className="rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/50 px-2 py-2 text-center"
            >
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{l.label}</div>
              <div className="font-mono text-sm font-semibold" style={{ color: l.color }}>
                {l.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {workerUtilization.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
            Worker Heatmap
          </h3>
          <div className="space-y-1">
            {workerUtilization.map((worker) => (
              <div key={worker.workerId} className="flex items-center gap-2">
                <span className="text-[10px] font-mono w-10 text-slate-600 dark:text-slate-400">
                  {worker.workerId}
                </span>
                <div className="flex-1 flex gap-px h-3">
                  {worker.history.map((status, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-sm ${
                        status === 'busy'
                          ? 'bg-amber-500'
                          : status === 'unhealthy'
                            ? 'bg-rose-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                  {worker.history.length === 0 && (
                    <div className="flex-1 rounded-sm bg-slate-200 dark:bg-slate-800" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-sm bg-amber-500" />
              Busy
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-sm bg-rose-500" />
              Unhealthy
            </span>
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-700" />
              Idle
            </span>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
        <button
          onClick={onExport}
          className="flex-1 px-2 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
        >
          Export State
        </button>
        <label className="flex-1 px-2 py-1.5 rounded-md bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 text-xs font-medium hover:bg-sky-200 dark:hover:bg-sky-600/30 transition text-center cursor-pointer">
          Import State
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.currentTarget.value = ''
            }}
          />
        </label>
      </div>
    </div>
  )
}
