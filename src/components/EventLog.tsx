import { useMemo, useState } from 'react'
import type { SimulationEvent, SimulationEventType } from '../types'

interface EventLogProps {
  events: SimulationEvent[]
}

const eventTypeColors: Record<SimulationEventType, string> = {
  TASK_CREATED: 'text-sky-600 dark:text-sky-400',
  TASK_ASSIGNED: 'text-cyan-600 dark:text-cyan-400',
  TASK_STARTED: 'text-amber-600 dark:text-amber-400',
  TASK_COMPLETED: 'text-emerald-600 dark:text-emerald-400',
  TASK_FAILED: 'text-rose-600 dark:text-rose-400',
  TASK_RETRIED: 'text-amber-600 dark:text-amber-400',
  TASK_MOVED_TO_DLQ: 'text-slate-600 dark:text-slate-400',
  WORKER_STARTED: 'text-violet-600 dark:text-violet-400',
  WORKER_IDLE: 'text-slate-500 dark:text-slate-500',
  WORKER_HEALTHY: 'text-emerald-600 dark:text-emerald-400',
  WORKER_UNHEALTHY: 'text-rose-600 dark:text-rose-400',
  SYSTEM_OVERLOAD: 'text-red-600 dark:text-red-400',
  BACKPRESSURE_APPLIED: 'text-orange-600 dark:text-orange-400',
  BATCH_SPAWNED: 'text-violet-600 dark:text-violet-400',
  ALL_TASKS_COMPLETED: 'text-emerald-600 dark:text-emerald-400',
}

export function EventLog({ events }: EventLogProps) {
  const [filter, setFilter] = useState<SimulationEventType | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    const list = filter === 'ALL' ? events : events.filter((e) => e.type === filter)
    return list.slice().reverse().slice(0, 50)
  }, [events, filter])

  const counts = useMemo(() => {
    const map = new Map<SimulationEventType, number>()
    events.forEach((e) => {
      map.set(e.type, (map.get(e.type) || 0) + 1)
    })
    return map
  }, [events])

  const types = Array.from(counts.keys())

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
          Event Log
        </span>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as SimulationEventType | 'ALL')}
          className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-200"
        >
          <option value="ALL">All ({events.length})</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t} ({counts.get(t)})
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto px-3 py-2 space-y-1.5">
        {filtered.map((event, idx) => (
          <div
            key={`${event.timestamp}-${idx}`}
            className="text-xs font-mono border-l-2 border-slate-300 dark:border-slate-700 pl-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className={`font-semibold ${eventTypeColors[event.type]}`}>{event.type}</span>
            </div>
            {event.taskId && (
              <div className="text-slate-500 dark:text-slate-400 truncate">
                task:{event.taskId.slice(-8)}
              </div>
            )}
            {event.workerId && (
              <div className="text-slate-500 dark:text-slate-400 truncate">
                worker:{event.workerId}
              </div>
            )}
            {event.message && (
              <div className="text-slate-500 dark:text-slate-400 truncate">{event.message}</div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
            No events
          </div>
        )}
      </div>
    </div>
  )
}
