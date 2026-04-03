import type { WorkerUtilization } from '../types'

interface WorkerHeatmapProps {
  utilization: WorkerUtilization[]
}

export function WorkerHeatmap({ utilization }: WorkerHeatmapProps) {
  if (utilization.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400 dark:text-slate-500 text-center">
        No utilization data yet
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Worker Utilization Heatmap
      </h3>
      <div className="space-y-2">
        {utilization.map((worker) => (
          <div key={worker.workerId} className="flex items-center gap-2">
            <span className="text-xs font-mono w-12 text-slate-600 dark:text-slate-400">
              {worker.workerId}
            </span>
            <div className="flex-1 flex gap-0.5 h-4">
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
                  title={status}
                />
              ))}
              {worker.history.length === 0 && (
                <div className="flex-1 rounded-sm bg-slate-200 dark:bg-slate-800" />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-500" />
          Busy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-rose-500" />
          Unhealthy
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-slate-300 dark:bg-slate-700" />
          Idle
        </span>
      </div>
    </div>
  )
}
