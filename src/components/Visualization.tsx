import { motion, AnimatePresence } from 'framer-motion'
import type { Task, Worker, WorkerProfile } from '../types'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface VisualizationProps {
  tasks: Map<string, Task>
  workers: Worker[]
  mainQueue: string[]
  retryQueue: string[]
  deadLetterQueue: string[]
  maxQueueCapacity?: number
}

const profileColors: Record<WorkerProfile, string> = {
  fast: 'bg-emerald-400',
  normal: 'bg-sky-400',
  slow: 'bg-amber-400',
  unreliable: 'bg-rose-400',
}

export function Visualization({
  tasks,
  workers,
  mainQueue,
  retryQueue,
  deadLetterQueue,
  maxQueueCapacity = 200,
}: VisualizationProps) {
  const reducedMotion = useReducedMotion()
  const mainCount = Math.min(mainQueue.length, 24)
  const retryCount = Math.min(retryQueue.length, 12)
  const dlqCount = Math.min(deadLetterQueue.length, 12)
  const isOverloaded = mainQueue.length > workers.length * 3
  const isBackpressure = mainQueue.length >= maxQueueCapacity * 0.9

  const priorityCounts = { high: 0, medium: 0, low: 0 }
  for (const taskId of mainQueue) {
    const task = tasks.get(taskId)
    if (!task) continue
    if (task.priority >= 2) priorityCounts.high++
    else if (task.priority === 1) priorityCounts.medium++
    else priorityCounts.low++
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-500">
        Pipeline
      </h2>

      <div
        className="flex flex-wrap items-center gap-2 lg:gap-4"
        aria-label="Simulation pipeline overview"
      >
        <StageBox
          label="Prod"
          lgLabel="Producer"
          count={tasks.size}
          color="bg-violet-600"
          pulse={isBackpressure}
          ringColor={isBackpressure ? 'ring-rose-500' : undefined}
          aria-label={`Producer stage with ${tasks.size} tasks`}
        />
        <FlowArrow aria-label="Pipeline arrow" animated={!reducedMotion} />
        <StageBox
          label="Queue"
          lgLabel="Main Queue"
          count={mainQueue.length}
          color={isOverloaded ? 'bg-rose-600' : 'bg-sky-600'}
          pulse={isOverloaded}
          aria-label={`Main queue with ${mainQueue.length} tasks`}
        />
        <FlowArrow aria-label="Pipeline arrow" animated={!reducedMotion} />
        <StageBox
          label="Work"
          lgLabel="Workers"
          count={workers.filter((w) => w.busy).length}
          color="bg-amber-600"
          aria-label={`Workers stage with ${workers.filter((w) => w.busy).length} active workers`}
        />
        <FlowArrow aria-label="Pipeline arrow" animated={!reducedMotion} />
        <StageBox
          label="Done"
          lgLabel="Results"
          count={
            tasks.size > 0
              ? Math.max(
                  0,
                  tasks.size - mainQueue.length - retryQueue.length - deadLetterQueue.length,
                )
              : 0
          }
          color="bg-emerald-600"
          aria-label={`Results stage with ${tasks.size > 0 ? Math.max(0, tasks.size - mainQueue.length - retryQueue.length - deadLetterQueue.length) : 0} completed tasks`}
        />
      </div>

      {mainQueue.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-500">
              Priority Lanes
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              High {priorityCounts.high} · Med {priorityCounts.medium} · Low {priorityCounts.low}
            </span>
          </div>
          <div
            className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex"
            aria-label={`Priority distribution: ${priorityCounts.high} high, ${priorityCounts.medium} medium, ${priorityCounts.low} low`}
            role="img"
          >
            {priorityCounts.high > 0 && (
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${(priorityCounts.high / mainQueue.length) * 100}%` }}
              />
            )}
            {priorityCounts.medium > 0 && (
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${(priorityCounts.medium / mainQueue.length) * 100}%` }}
              />
            )}
            {priorityCounts.low > 0 && (
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(priorityCounts.low / mainQueue.length) * 100}%` }}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <QueueCard
          title="Main Queue"
          count={mainQueue.length}
          items={mainCount}
          color="bg-sky-500"
        />
        <QueueCard
          title="Retry Queue"
          count={retryQueue.length}
          items={retryCount}
          color="bg-amber-500"
        />
        <QueueCard
          title="Dead Letter Queue"
          count={deadLetterQueue.length}
          items={dlqCount}
          color="bg-slate-500"
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500">Worker Pool</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span>⚡ Fast</span>
            <span>● Normal</span>
            <span>🐢 Slow</span>
            <span>⚠️ Unreliable</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {workers.map((worker) => {
            const isUnhealthy = !worker.healthy
            return (
              <motion.div
                key={worker.id}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        scale: worker.busy ? 1.05 : 1,
                        backgroundColor: isUnhealthy
                          ? '#f43f5e'
                          : worker.busy
                            ? '#f59e0b'
                            : '#cbd5e1',
                      }
                }
                className="w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold text-slate-900 dark:text-slate-900 relative"
                title={`${worker.id} | ${worker.profile} | Processed: ${worker.processedCount}${isUnhealthy ? ' | CIRCUIT BREAKER' : ''}`}
                aria-label={`Worker ${worker.id}, profile ${worker.profile}, processed ${worker.processedCount} tasks${isUnhealthy ? ', circuit breaker active' : ''}`}
                role="img"
                style={{
                  backgroundColor: isUnhealthy ? '#f43f5e' : worker.busy ? '#f59e0b' : '#cbd5e1',
                }}
              >
                {worker.id.split('-')[1]}
                <span
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${profileColors[worker.profile]}`}
                  aria-hidden="true"
                />
                {isUnhealthy && (
                  <span className="absolute -bottom-1 text-[8px] text-rose-600 font-bold">CB</span>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500">Live Tasks</h3>
        <div className="flex flex-wrap gap-1">
          <AnimatePresence>
            {Array.from(tasks.values())
              .filter((t) => t.status === 'processing')
              .slice(0, 30)
              .map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  initial={reducedMotion ? false : { opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0 }}
                  transition={reducedMotion ? { duration: 0 } : undefined}
                  className="w-6 h-6 rounded bg-amber-500"
                  title={task.id}
                  aria-hidden="true"
                />
              ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function StageBox({
  label,
  lgLabel,
  count,
  color,
  pulse = false,
  ringColor,
  'aria-label': ariaLabel,
}: {
  label: string
  lgLabel?: string
  count: number
  color: string
  pulse?: boolean
  ringColor?: string
  'aria-label'?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        aria-label={ariaLabel}
        role="img"
        className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg ${color} flex items-center justify-center text-white font-bold shadow-lg ${pulse ? 'animate-pulse' : ''} ${ringColor ? `ring-4 ${ringColor}` : ''}`}
      >
        {count}
      </div>
      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
        <span className="sm:hidden">{label}</span>
        <span className="hidden sm:inline">{lgLabel || label}</span>
      </span>
    </div>
  )
}

function FlowArrow({
  'aria-label': ariaLabel,
  animated,
}: {
  'aria-label'?: string
  animated?: boolean
}) {
  return (
    <div
      className="w-12 h-6 flex items-center justify-center"
      aria-label={ariaLabel}
      aria-hidden="true"
    >
      <svg width="48" height="20" viewBox="0 0 48 20" className="overflow-visible">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" className="fill-slate-400 dark:fill-slate-600" />
          </marker>
        </defs>
        <path
          d="M 0 10 Q 24 6 44 10"
          className={`stroke-slate-400 dark:stroke-slate-600 fill-none ${animated ? 'flow-arrow' : ''}`}
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          strokeDasharray={animated ? '6 4' : undefined}
        />
      </svg>
      <style>{`
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-arrow {
          animation: flowDash 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

function QueueCard({
  title,
  count,
  items,
  color,
}: {
  title: string
  count: number
  items: number
  color: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">{title}</span>
        <span className="font-mono text-slate-800 dark:text-slate-200">{count}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        {count > items && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">+{count - items}</span>
        )}
      </div>
    </div>
  )
}
