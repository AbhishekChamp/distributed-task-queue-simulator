import { useState, useCallback } from 'react'
import type {
  SimulationMetrics,
  MetricsHistoryPoint,
  WorkerUtilization,
  SimulationState,
  SimulationEvent,
  Task,
} from '../types'
import { Sparkline } from './Sparkline'
import { Tooltip } from './Tooltip'
import {
  downloadCSV,
  buildTaskExportData,
  buildMetricsHistoryCSV,
  buildEventsCSV,
} from '../lib/csvExport'
import { saveSession, loadSessions, deleteSession } from '../lib/indexeddb'
import { SessionReplay } from './SessionReplay'

interface MetricsPanelProps {
  metrics: SimulationMetrics
  metricsHistory: MetricsHistoryPoint[]
  workerUtilization: WorkerUtilization[]
  tasks: Map<string, Task>
  events: SimulationEvent[]
  snapshots: SimulationState[]
  onExport: () => void
  onImport: (file: File) => void
}

export function MetricsPanel({
  metrics,
  metricsHistory,
  workerUtilization,
  tasks,
  events,
  snapshots,
  onExport,
  onImport,
}: MetricsPanelProps) {
  const [sessions, setSessions] = useState<{ id: string; name: string; createdAt: number }[]>([])
  const [showReplay, setShowReplay] = useState(false)

  const refreshSessions = useCallback(async () => {
    const list = await loadSessions()
    setSessions(list.map((s) => ({ id: s.id, name: s.name, createdAt: s.createdAt })))
  }, [])

  const handleSaveSession = async () => {
    const name = `Session ${new Date().toLocaleString()}`
    await saveSession(name, snapshots, events)
    refreshSessions()
  }

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id)
    refreshSessions()
  }

  const handleExportTasksCSV = () => {
    const data = buildTaskExportData(tasks)
    const csv = exportTasksAsCSV(data)
    if (csv) downloadCSV(`tasks-${Date.now()}.csv`, csv)
  }

  const handleExportMetricsCSV = () => {
    const csv = buildMetricsHistoryCSV(metricsHistory)
    if (csv) downloadCSV(`metrics-${Date.now()}.csv`, csv)
  }

  const handleExportEventsCSV = () => {
    const csv = buildEventsCSV(events)
    if (csv) downloadCSV(`events-${Date.now()}.csv`, csv)
  }

  const items: {
    label: string
    value: number | string
    color: string
    historyKey: keyof SimulationMetrics
    tip: string
  }[] = [
    {
      label: 'Queue Depth',
      value: metrics.queued,
      color: '#0ea5e9',
      historyKey: 'queued',
      tip: 'Total tasks currently waiting in the main queue.',
    },
    {
      label: 'Processing',
      value: metrics.processing,
      color: '#f59e0b',
      historyKey: 'processing',
      tip: 'Tasks currently being handled by workers.',
    },
    {
      label: 'Active Workers',
      value: metrics.activeWorkers,
      color: '#10b981',
      historyKey: 'activeWorkers',
      tip: 'Number of workers currently busy with a task.',
    },
    {
      label: 'Tasks / sec',
      value: metrics.tasksPerSecond,
      color: '#8b5cf6',
      historyKey: 'tasksPerSecond',
      tip: 'Throughput: how many tasks were completed in the last second.',
    },
    {
      label: 'Success',
      value: metrics.success,
      color: '#10b981',
      historyKey: 'success',
      tip: 'Total tasks completed successfully.',
    },
    {
      label: 'Failed',
      value: metrics.failed,
      color: '#f43f5e',
      historyKey: 'failed',
      tip: 'Tasks that failed and may be retried.',
    },
    {
      label: 'Retrying',
      value: metrics.retry,
      color: '#f59e0b',
      historyKey: 'retry',
      tip: 'Tasks currently waiting in the retry queue with backoff.',
    },
    {
      label: 'DLQ',
      value: metrics.dead,
      color: '#64748b',
      historyKey: 'dead',
      tip: 'Dead Letter Queue: tasks that exhausted all retries.',
    },
    {
      label: 'Failure Rate',
      value: `${metrics.failureRate}%`,
      color: '#f43f5e',
      historyKey: 'failureRate',
      tip: 'Percentage of completed tasks that ended in failure or DLQ.',
    },
  ]

  const latencies = [
    {
      label: 'p50 Latency',
      value: `${metrics.p50Latency}ms`,
      color: '#38bdf8',
      tip: '50% of tasks finished within this time.',
    },
    {
      label: 'p95 Latency',
      value: `${metrics.p95Latency}ms`,
      color: '#a855f7',
      tip: '95% of tasks finished within this time.',
    },
    {
      label: 'p99 Latency',
      value: `${metrics.p99Latency}ms`,
      color: '#f43f5e',
      tip: '99% of tasks finished within this time.',
    },
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
                <Tooltip content={item.tip}>
                  <span className="text-sm text-slate-600 dark:text-slate-400 cursor-help underline decoration-dotted underline-offset-2">
                    {item.label}
                  </span>
                </Tooltip>
                <span className="font-mono text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {item.value}
                </span>
              </div>
              <Sparkline
                data={history.length > 1 ? history : [0, 0]}
                width={80}
                height={28}
                color={item.color}
                aria-label={`${item.label} trend chart`}
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
              <Tooltip content={l.tip}>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 cursor-help underline decoration-dotted underline-offset-2">
                  {l.label}
                </div>
              </Tooltip>
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

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
          Export
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportTasksCSV}
            className="px-2 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Tasks CSV
          </button>
          <button
            onClick={handleExportMetricsCSV}
            className="px-2 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Metrics CSV
          </button>
          <button
            onClick={handleExportEventsCSV}
            className="px-2 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            Events CSV
          </button>
          <button
            onClick={onExport}
            className="px-2 py-1.5 rounded-md bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 text-xs font-medium hover:bg-sky-200 dark:hover:bg-sky-600/30 transition"
          >
            JSON State
          </button>
        </div>
        <label
          aria-label="Import simulation state from JSON file"
          className="block w-full px-2 py-1.5 rounded-md bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-600/30 transition text-center cursor-pointer"
        >
          Import State
          <input
            type="file"
            accept="application/json"
            aria-label="Choose JSON file to import"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onImport(file)
              e.currentTarget.value = ''
            }}
          />
        </label>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
            Session Persistence
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={refreshSessions}
              className="px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition"
            >
              Load
            </button>
            <button
              onClick={handleSaveSession}
              className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition"
            >
              Save
            </button>
          </div>
        </div>
        {sessions.length > 0 && (
          <div className="space-y-1 max-h-32 overflow-auto">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-2 py-1"
              >
                <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                  {s.name}
                </span>
                <button
                  onClick={() => handleDeleteSession(s.id)}
                  className="text-[10px] text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {snapshots.length > 0 && (
        <div className="pt-2">
          <button
            onClick={() => setShowReplay(true)}
            className="w-full px-2 py-1.5 rounded-md bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-600/30 transition"
          >
            Replay Session ({snapshots.length} frames)
          </button>
        </div>
      )}

      {showReplay && <SessionReplay snapshots={snapshots} onClose={() => setShowReplay(false)} />}
    </div>
  )
}

function exportTasksAsCSV(tasks: Map<string, Record<string, unknown>>): string {
  const rows = Array.from(tasks.values())
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const csvRows = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h]
          const str = val == null ? '' : String(val)
          return `"${str.replace(/"/g, '""')}"`
        })
        .join(','),
    ),
  ]
  return csvRows.join('\n')
}
