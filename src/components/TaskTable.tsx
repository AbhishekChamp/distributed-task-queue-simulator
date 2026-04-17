import { useState, useMemo, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { SimulationEvent, Task, TaskStatus } from '../types'
import { TaskDetail } from './TaskDetail'
import { Filter, X } from './icons'

interface TaskTableProps {
  tasks: Map<string, Task>
  events?: SimulationEvent[]
  onCancelTasks?: (taskIds: string[]) => void
  onRetryTasks?: (taskIds: string[]) => void
}

const statusOptions: TaskStatus[] = ['queued', 'processing', 'success', 'failed', 'retry', 'dead']

export function TaskTable({ tasks, events = [], onCancelTasks, onRetryTasks }: TaskTableProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TaskStatus | 'all'>('all')
  const [showFailedOnly, setShowFailedOnly] = useState(false)
  const [showRetriedOnly, setShowRetriedOnly] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const parentRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedTaskId) {
      closeButtonRef.current?.focus()
    }
  }, [selectedTaskId])

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
    return result.slice().sort((a, b) => b.createdAt - a.createdAt)
  }, [allTasks, filter, showFailedOnly, showRetriedOnly])

  // Clear selections when filter changes to avoid stale selections
  useEffect(() => {
    setSelectedIds(new Set())
  }, [filter, showFailedOnly, showRetriedOnly])

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: filteredTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  })

  const selectedTask = selectedTaskId ? tasks.get(selectedTaskId) || null : null

  const toggleSelect = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleSelectAll = () => {
    const visibleIds = filteredTasks.map((t) => t.id)
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleExportSelected = () => {
    const rows = Array.from(selectedIds)
      .map((id) => tasks.get(id))
      .filter(Boolean) as Task[]
    if (rows.length === 0) return
    const headers = Object.keys(rows[0] as unknown as Record<string, unknown>)
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = (row as unknown as Record<string, unknown>)[h]
            const str = val == null ? '' : String(val)
            return `"${str.replace(/"/g, '""')}"`
          })
          .join(','),
      ),
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `selected-tasks-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedList = Array.from(selectedIds)
  const canCancel = selectedList.some((id) => tasks.get(id)?.status === 'queued')
  const canRetry = selectedList.some(
    (id) => tasks.get(id)?.status === 'failed' || tasks.get(id)?.status === 'dead',
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase">Filters</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as TaskStatus | 'all')}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
          >
            <option value="all">All Statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showFailedOnly}
              onChange={(e) => setShowFailedOnly(e.target.checked)}
              className="accent-rose-500"
            />
            Failed only
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={showRetriedOnly}
              onChange={(e) => setShowRetriedOnly(e.target.checked)}
              className="accent-amber-500"
            />
            Retried only
          </label>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Showing {filteredTasks.length} tasks
        </span>
      </div>

      <div ref={parentRef} className="flex-1 overflow-auto">
        <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
          <div className="sticky top-0 z-10 flex bg-slate-100/90 dark:bg-slate-900/90 backdrop-blur text-slate-500 dark:text-slate-500 text-xs border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 px-2 py-2 flex items-center justify-center">
              <input
                type="checkbox"
                checked={
                  filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.has(t.id))
                }
                onChange={toggleSelectAll}
                aria-label="Select all visible tasks"
              />
            </div>
            <div className="flex-1 px-4 py-2 font-medium min-w-[120px]">ID</div>
            <div className="w-24 px-4 py-2 font-medium">Status</div>
            <div className="w-20 px-4 py-2 font-medium">Retries</div>
            <div className="w-24 px-4 py-2 font-medium">Duration</div>
            <div className="w-28 px-4 py-2 font-medium">Created</div>
          </div>
          {filteredTasks.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No tasks match the current filters.
            </div>
          )}
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const task = filteredTasks[virtualRow.index]
            const isSelected = selectedIds.has(task.id)
            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="absolute left-0 right-0 flex items-center text-xs border-b border-slate-200/50 dark:border-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer transition"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`,
                }}
              >
                <div
                  className="w-10 px-2 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSelect(task.id)
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(task.id)}
                    aria-label={`Select task ${task.id.slice(-6)}`}
                  />
                </div>
                <div className="flex-1 px-4 py-2 font-mono text-slate-700 dark:text-slate-300 min-w-[120px] truncate">
                  {task.id.slice(-12)}
                </div>
                <div className="w-24 px-4 py-2">
                  <StatusBadge status={task.status} />
                </div>
                <div className="w-20 px-4 py-2 text-slate-500 dark:text-slate-400">
                  {task.retryCount}
                </div>
                <div className="w-24 px-4 py-2 text-slate-500 dark:text-slate-400">
                  {Math.round(task.duration)}ms
                </div>
                <div className="w-28 px-4 py-2 text-slate-500 dark:text-slate-400">
                  {new Date(task.createdAt).toLocaleTimeString()}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg text-xs">
          <span className="font-medium">{selectedIds.size} selected</span>
          {onRetryTasks && canRetry && (
            <button
              onClick={() => {
                onRetryTasks(selectedList)
                setSelectedIds(new Set())
              }}
              className="px-2 py-1 rounded bg-emerald-600 dark:bg-emerald-500 text-white dark:text-white hover:bg-emerald-500 dark:hover:bg-emerald-400 transition"
            >
              Retry
            </button>
          )}
          {onCancelTasks && canCancel && (
            <button
              onClick={() => {
                onCancelTasks(selectedList)
                setSelectedIds(new Set())
              }}
              className="px-2 py-1 rounded bg-rose-600 dark:bg-rose-500 text-white dark:text-white hover:bg-rose-500 dark:hover:bg-rose-400 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleExportSelected}
            className="px-2 py-1 rounded bg-sky-600 dark:bg-sky-500 text-white dark:text-white hover:bg-sky-500 dark:hover:bg-sky-400 transition"
          >
            Export CSV
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="px-2 py-1 rounded bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 hover:bg-slate-600 dark:hover:bg-slate-200 transition"
          >
            Clear
          </button>
        </div>
      )}

      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-detail-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTaskId(null)
          }}
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <h3
                id="task-detail-title"
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                Task Lifecycle
              </h3>
              <button
                ref={closeButtonRef}
                onClick={() => setSelectedTaskId(null)}
                aria-label="Close task detail"
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <TaskDetail task={selectedTask} events={events} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<TaskStatus, string> = {
    queued: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400',
    processing: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400',
    retry: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
    dead: 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400',
  }
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${colors[status]}`}
    >
      {status}
    </span>
  )
}
