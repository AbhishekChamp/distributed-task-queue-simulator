import { useState, useMemo } from 'react'
import type { Task, TaskStatus } from '../types'
import { TaskDetail } from './TaskDetail'
import { Filter, X } from './icons'

interface TaskTableProps {
  tasks: Map<string, Task>
}

const statusOptions: TaskStatus[] = ['queued', 'processing', 'success', 'failed', 'retry', 'dead']

export function TaskTable({ tasks }: TaskTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [showFailedOnly, setShowFailedOnly] = useState(false)
  const [showRetriedOnly, setShowRetriedOnly] = useState(false)

  const allTasks = useMemo(() => Array.from(tasks.values()), [tasks])

  const filteredTasks = useMemo(() => {
    let result = allTasks
    if (filter !== 'all') {
      result = result.filter((t) => t.status === filter)
    }
    if (showFailedOnly) {
      result = result.filter((t) => t.status === 'failed' || t.status === 'dead')
    }
    if (showRetriedOnly) {
      result = result.filter((t) => t.retryCount > 0)
    }
    return result
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100)
  }, [allTasks, filter, showFailedOnly, showRetriedOnly])

  const selectedTask = selectedTaskId ? tasks.get(selectedTaskId) || null : null

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Filters</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showFailedOnly}
              onChange={(e) => setShowFailedOnly(e.target.checked)}
              className="accent-rose-500"
            />
            Failed only
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showRetriedOnly}
              onChange={(e) => setShowRetriedOnly(e.target.checked)}
              className="accent-amber-500"
            />
            Retried only
          </label>
        </div>
        <span className="text-xs text-slate-500">Showing {filteredTasks.length} tasks</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-slate-900/90 backdrop-blur">
            <tr className="text-slate-500">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Retries</th>
              <th className="px-4 py-2 font-medium">Duration</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="border-b border-slate-800/50 hover:bg-slate-800/40 cursor-pointer transition"
              >
                <td className="px-4 py-2 font-mono text-slate-300">{task.id.slice(-12)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-2 text-slate-400">{task.retryCount}</td>
                <td className="px-4 py-2 text-slate-400">{Math.round(task.duration)}ms</td>
                <td className="px-4 py-2 text-slate-400">
                  {new Date(task.createdAt).toLocaleTimeString()}
                </td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No tasks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-slate-100">Task Lifecycle</h3>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <TaskDetail task={selectedTask} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<TaskStatus, string> = {
    queued: 'bg-sky-500/20 text-sky-400',
    processing: 'bg-amber-500/20 text-amber-400',
    success: 'bg-emerald-500/20 text-emerald-400',
    failed: 'bg-rose-500/20 text-rose-400',
    retry: 'bg-amber-500/20 text-amber-400',
    dead: 'bg-slate-500/20 text-slate-400',
  }
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${colors[status]}`}
    >
      {status}
    </span>
  )
}
