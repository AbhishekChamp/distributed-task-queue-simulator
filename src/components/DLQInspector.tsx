import { useMemo } from 'react'
import type { Task } from '../types'
import { X } from './icons'
import { useFocusTrap } from '../hooks/useFocusTrap'

interface DLQInspectorProps {
  tasks: Map<string, Task>
  deadLetterQueue: string[]
  onClose: () => void
}

export function DLQInspector({ tasks, deadLetterQueue, onClose }: DLQInspectorProps) {
  const containerRef = useFocusTrap(true, onClose)

  const deadTasks = useMemo(() => {
    return deadLetterQueue
      .map((id) => tasks.get(id))
      .filter((t): t is Task => !!t)
      .slice()
      .reverse()
  }, [tasks, deadLetterQueue])

  const errorBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    deadTasks.forEach((t) => {
      const key = t.error || 'Unknown error'
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [deadTasks])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dlq-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-3xl max-h-[80vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 id="dlq-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Dead Letter Queue Inspector
          </h3>
          <button
            onClick={onClose}
            aria-label="Close Dead Letter Queue Inspector"
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Dead Tasks</div>
              <div className="text-2xl font-mono font-semibold text-slate-800 dark:text-slate-100">
                {deadTasks.length}
              </div>
            </div>
            <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3">
              <div className="text-xs text-slate-500 dark:text-slate-400">Unique Error Types</div>
              <div className="text-2xl font-mono font-semibold text-slate-800 dark:text-slate-100">
                {errorBreakdown.length}
              </div>
            </div>
          </div>

          {errorBreakdown.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
                Failure Breakdown
              </h4>
              <div className="space-y-1">
                {errorBreakdown.map(([error, count]) => (
                  <div
                    key={error}
                    className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300 truncate pr-4">
                      {error}
                    </span>
                    <span className="font-mono text-sm font-semibold text-rose-600 dark:text-rose-400">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500 mb-2">
              Dead Tasks
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900">
                  <tr className="text-slate-500 dark:text-slate-500">
                    <th className="px-3 py-2 font-medium">ID</th>
                    <th className="px-3 py-2 font-medium">Retries</th>
                    <th className="px-3 py-2 font-medium">Duration</th>
                    <th className="px-3 py-2 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {deadTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-200 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                        {task.id.slice(-12)}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                        {task.retryCount}
                      </td>
                      <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                        {Math.round(task.duration)}ms
                      </td>
                      <td className="px-3 py-2 text-rose-600 dark:text-rose-400 truncate max-w-xs">
                        {task.error || '-'}
                      </td>
                    </tr>
                  ))}
                  {deadTasks.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-slate-400 dark:text-slate-500"
                      >
                        No tasks in DLQ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
