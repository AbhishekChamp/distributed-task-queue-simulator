import type { SimulationEvent, Task } from '../types'

interface TaskDetailProps {
  task: Task
  events?: SimulationEvent[]
}

type TraceStep = {
  label: string
  time?: number
  active: boolean
  workerId?: string
  message?: string
  tone: 'neutral' | 'success' | 'warning' | 'error'
}

export function TaskDetail({ task, events = [] }: TaskDetailProps) {
  const traceSteps: TraceStep[] = buildTrace(task, events)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 dark:text-slate-500 text-xs">Task ID</div>
          <div className="font-mono text-slate-800 dark:text-slate-200">{task.id}</div>
        </div>
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 dark:text-slate-500 text-xs">Status</div>
          <div className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
            {task.status}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 dark:text-slate-500 text-xs">Retries</div>
          <div className="font-mono text-slate-800 dark:text-slate-200">
            {task.retryCount} / {task.maxRetries}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 dark:text-slate-500 text-xs">Priority</div>
          <div className="font-mono text-slate-800 dark:text-slate-200">{task.priority}</div>
        </div>
        <div className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
          <div className="text-slate-500 dark:text-slate-500 text-xs">Duration</div>
          <div className="font-mono text-slate-800 dark:text-slate-200">
            {Math.round(task.duration)}ms
          </div>
        </div>
        {task.error && (
          <div className="col-span-2 rounded-md border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 px-3 py-2">
            <div className="text-rose-600 dark:text-rose-400 text-xs">Error</div>
            <div className="text-rose-700 dark:text-rose-300 text-sm">{task.error}</div>
          </div>
        )}
        {task.parentId && (
          <div className="col-span-2 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-2">
            <div className="text-slate-500 dark:text-slate-500 text-xs">Parent Task</div>
            <div className="font-mono text-slate-800 dark:text-slate-200">{task.parentId}</div>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-500 mb-2">
          Lifecycle Trace
        </h4>
        <div className="relative pl-4">
          <div className="absolute left-1.5 top-1 bottom-1 w-px bg-slate-300 dark:bg-slate-700" />
          <div className="space-y-3">
            {traceSteps.map((step, idx) => (
              <div key={`${step.label}-${idx}`} className="relative flex flex-col gap-0.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`absolute -left-2.5 w-2.5 h-2.5 rounded-full border-2 ${
                      step.active
                        ? toneClasses(step.tone)
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600'
                    }`}
                  />
                  <div
                    className={`text-sm ${
                      step.active
                        ? 'text-slate-800 dark:text-slate-200'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {step.label}
                  </div>
                  {step.time && (
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {new Date(step.time).toLocaleTimeString()}.
                      {String(new Date(step.time).getMilliseconds()).padStart(3, '0')}
                    </div>
                  )}
                </div>
                {step.workerId && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 pl-3">
                    Worker: <span className="font-mono">{step.workerId}</span>
                  </div>
                )}
                {step.message && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 pl-3">
                    {step.message}
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

function toneClasses(tone: TraceStep['tone']): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-500 border-emerald-500'
    case 'warning':
      return 'bg-amber-500 border-amber-500'
    case 'error':
      return 'bg-rose-500 border-rose-500'
    default:
      return 'bg-sky-500 border-sky-500'
  }
}

function buildTrace(task: Task, events: SimulationEvent[]): TraceStep[] {
  const taskEvents = events
    .filter((e) => e.taskId === task.id)
    .sort((a, b) => a.timestamp - b.timestamp)

  const trace: TraceStep[] = [
    { label: 'Created', time: task.createdAt, active: true, tone: 'neutral' },
  ]

  for (const ev of taskEvents) {
    switch (ev.type) {
      case 'TASK_STARTED':
        trace.push({
          label: 'Started',
          time: ev.timestamp,
          active: true,
          workerId: ev.workerId,
          tone: 'neutral',
        })
        break
      case 'TASK_COMPLETED':
        trace.push({
          label: 'Completed',
          time: ev.timestamp,
          active: true,
          workerId: ev.workerId,
          tone: 'success',
        })
        break
      case 'TASK_FAILED':
        trace.push({
          label: 'Failed',
          time: ev.timestamp,
          active: true,
          workerId: ev.workerId,
          message: ev.message,
          tone: 'error',
        })
        break
      case 'TASK_RETRIED':
        trace.push({
          label: 'Retried',
          time: ev.timestamp,
          active: true,
          workerId: ev.workerId,
          message: ev.message,
          tone: 'warning',
        })
        break
      case 'TASK_MOVED_TO_DLQ':
        trace.push({
          label: 'Moved to DLQ',
          time: ev.timestamp,
          active: true,
          workerId: ev.workerId,
          message: ev.message,
          tone: 'error',
        })
        break
      case 'BATCH_SPAWNED':
        trace.push({
          label: 'Batch Spawned',
          time: ev.timestamp,
          active: true,
          message: ev.message,
          tone: 'neutral',
        })
        break
    }
  }

  // If no events enriched the trace beyond Created, fall back to field-based steps
  if (trace.length === 1) {
    trace.push(
      { label: 'Started', time: task.startedAt, active: !!task.startedAt, tone: 'neutral' },
      {
        label:
          task.status === 'success' ? 'Completed' : task.status === 'dead' ? 'Dead' : 'Completed',
        time: task.completedAt,
        active: !!task.completedAt,
        tone: task.status === 'success' ? 'success' : task.status === 'dead' ? 'error' : 'neutral',
      },
    )
  }

  return trace
}
