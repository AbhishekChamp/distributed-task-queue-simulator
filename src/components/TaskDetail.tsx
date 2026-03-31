import type { Task } from '../types'

interface TaskDetailProps {
  task: Task
}

export function TaskDetail({ task }: TaskDetailProps) {
  const steps = [
    { label: 'Created', time: task.createdAt, active: true },
    { label: 'Started', time: task.startedAt, active: !!task.startedAt },
    { label: 'Completed', time: task.completedAt, active: !!task.completedAt },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 text-xs">Task ID</div>
          <div className="font-mono text-slate-200">{task.id}</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 text-xs">Status</div>
          <div className="font-semibold text-slate-200 capitalize">{task.status}</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 text-xs">Retries</div>
          <div className="font-mono text-slate-200">
            {task.retryCount} / {task.maxRetries}
          </div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 text-xs">Priority</div>
          <div className="font-mono text-slate-200">{task.priority}</div>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 text-xs">Duration</div>
          <div className="font-mono text-slate-200">{Math.round(task.duration)}ms</div>
        </div>
        {task.error && (
          <div className="col-span-2 rounded-md border border-rose-900/50 bg-rose-950/20 px-3 py-2">
            <div className="text-rose-400 text-xs">Error</div>
            <div className="text-rose-300 text-sm">{task.error}</div>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 mb-2">Lifecycle Timeline</h4>
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-700" />
          <div className="space-y-3">
            {steps.map((step) => (
              <div key={step.label} className="relative flex items-center gap-3">
                <div
                  className={`absolute -left-2.5 w-2.5 h-2.5 rounded-full border-2 ${step.active ? 'bg-sky-500 border-sky-500' : 'bg-slate-900 border-slate-600'}`}
                />
                <div className={`text-sm ${step.active ? 'text-slate-200' : 'text-slate-600'}`}>
                  {step.label}
                </div>
                {step.time && (
                  <div className="text-xs font-mono text-slate-400">
                    {new Date(step.time).toLocaleTimeString()}.
                    {String(new Date(step.time).getMilliseconds()).padStart(3, '0')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
