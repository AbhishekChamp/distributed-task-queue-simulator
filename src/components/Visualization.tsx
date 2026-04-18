import { useRef, useEffect, useState, useCallback, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Task, Worker, WorkerProfile, SimulationEvent, LoadBalancingStrategy } from '../types'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { TaskParticles } from './TaskParticles'

interface VisualizationProps {
  tasks: Map<string, Task>
  workers: Worker[]
  mainQueue: string[]
  retryQueue: string[]
  deadLetterQueue: string[]
  maxQueueCapacity?: number
  simulationSpeed?: number
  events?: SimulationEvent[]
  retryDelays?: Record<string, number>
  strategy?: LoadBalancingStrategy
  onKillWorker?: (workerId: string) => void
  onHealWorker?: (workerId: string) => void
  onFailTask?: (taskId: string) => void
}

const profileColors: Record<WorkerProfile, string> = {
  fast: 'bg-emerald-400',
  normal: 'bg-sky-400',
  slow: 'bg-amber-400',
  unreliable: 'bg-rose-400',
}

const profileShapes: Record<WorkerProfile, string> = {
  fast: 'rounded-full',
  normal: 'rounded-sm',
  slow: 'rotate-45 rounded-sm scale-75',
  unreliable: 'clip-triangle',
}

const profileLabels: Record<WorkerProfile, string> = {
  fast: '⚡',
  normal: '●',
  slow: '🐢',
  unreliable: '⚠',
}

const strategyLabels: Record<LoadBalancingStrategy, string> = {
  'round-robin': 'RR',
  'least-connections': 'LC',
  random: 'RND',
}

function useNow(interval = 100) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

export function Visualization({
  tasks,
  workers,
  mainQueue,
  retryQueue,
  deadLetterQueue,
  maxQueueCapacity = 200,
  simulationSpeed = 1,
  events = [],
  retryDelays = {},
  strategy = 'round-robin',
  onKillWorker,
  onHealWorker,
  onFailTask,
}: VisualizationProps) {
  const reducedMotion = useReducedMotion()
  const now = useNow(100)
  const containerRef = useRef<HTMLDivElement>(null)
  const queueRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const retryQueueCardRef = useRef<HTMLDivElement>(null)
  const dlqCardRef = useRef<HTMLDivElement>(null)
  const workerRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [flashes, setFlashes] = useState<{ id: string; workerId: string; until: number }[]>([])

  useEffect(() => {
    const currentIds = new Set(workers.map((w) => w.id))
    workerRefs.current.forEach((_, id) => {
      if (!currentIds.has(id)) workerRefs.current.delete(id)
    })
  }, [workers])

  useEffect(() => {
    const latest = events.slice(-5)
    const newFlashes: { id: string; workerId: string; until: number }[] = []
    for (const ev of latest) {
      if (ev.type === 'TASK_ASSIGNED' && ev.workerId) {
        newFlashes.push({
          id: `${ev.timestamp}-${ev.workerId}`,
          workerId: ev.workerId,
          until: Date.now() + 800,
        })
      }
    }
    if (newFlashes.length > 0) {
      queueMicrotask(() => {
        setFlashes((prev) => {
          const cutoff = Date.now()
          const filtered = prev.filter((f) => f.until > cutoff)
          return [...filtered, ...newFlashes]
        })
      })
    }
  }, [events])

  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now()
      setFlashes((prev) => prev.filter((f) => f.until > cutoff))
    }, 200)
    return () => clearInterval(id)
  }, [])

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
    <div ref={containerRef} className="relative space-y-6">
      <TaskParticles
        tasks={tasks}
        workers={workers}
        events={events}
        containerRef={containerRef}
        queueRef={queueRef}
        resultsRef={resultsRef}
        retryQueueCardRef={retryQueueCardRef}
        dlqCardRef={dlqCardRef}
        workerRefs={workerRefs}
        reducedMotion={reducedMotion}
      />

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
          ref={queueRef}
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
          ref={resultsRef}
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
            className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex text-[8px] text-white font-bold"
            aria-label={`Priority distribution: ${priorityCounts.high} high, ${priorityCounts.medium} medium, ${priorityCounts.low} low`}
            role="img"
          >
            {priorityCounts.high > 0 && (
              <div
                className="bg-rose-500 h-full flex items-center justify-center"
                style={{ width: `${(priorityCounts.high / mainQueue.length) * 100}%` }}
                title="High priority"
              >
                ★
              </div>
            )}
            {priorityCounts.medium > 0 && (
              <div
                className="bg-amber-500 h-full flex items-center justify-center"
                style={{ width: `${(priorityCounts.medium / mainQueue.length) * 100}%` }}
                title="Medium priority"
              >
                ●
              </div>
            )}
            {priorityCounts.low > 0 && (
              <div
                className="bg-emerald-500 h-full flex items-center justify-center"
                style={{ width: `${(priorityCounts.low / mainQueue.length) * 100}%` }}
                title="Low priority"
              >
                ○
              </div>
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
          ref={retryQueueCardRef}
          title="Retry Queue"
          count={retryQueue.length}
          items={retryCount}
          color="bg-amber-500"
          retryTaskIds={retryQueue.slice(0, 12)}
          retryDelays={retryDelays}
          now={now}
        />
        <QueueCard
          ref={dlqCardRef}
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
        <div className="flex flex-wrap gap-2 relative">
          {workers.map((worker) => (
            <WorkerDot
              key={worker.id}
              worker={worker}
              task={worker.currentTaskId ? tasks.get(worker.currentTaskId) : undefined}
              now={now}
              simulationSpeed={simulationSpeed}
              reducedMotion={reducedMotion}
              workerRefs={workerRefs}
              flash={flashes.some((f) => f.workerId === worker.id)}
              strategy={strategy}
              onKillWorker={onKillWorker}
              onHealWorker={onHealWorker}
              onFailTask={onFailTask}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500">Live Tasks</h3>
        <motion.div
          className="flex flex-wrap gap-1"
          variants={{
            visible: { transition: { staggerChildren: 0.02 } },
            hidden: {},
          }}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {Array.from(tasks.values())
              .filter((t) => t.status === 'processing')
              .slice(0, 30)
              .map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  layout
                  variants={{
                    hidden: reducedMotion ? {} : { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 },
                    exit: reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0 },
                  }}
                  transition={
                    reducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 400, damping: 25 }
                  }
                  className="w-6 h-6 rounded bg-amber-500"
                  title={task.id}
                  aria-hidden="true"
                />
              ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

const StageBox = forwardRef<
  HTMLDivElement,
  {
    label: string
    lgLabel?: string
    count: number
    color: string
    pulse?: boolean
    ringColor?: string
    'aria-label'?: string
  }
>(function StageBox(
  { label, lgLabel, count, color, pulse = false, ringColor, 'aria-label': ariaLabel },
  ref,
) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        ref={ref}
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
})

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

const QueueCard = forwardRef<
  HTMLDivElement,
  {
    title: string
    count: number
    items: number
    color: string
    retryTaskIds?: string[]
    retryDelays?: Record<string, number>
    now?: number
  }
>(function QueueCard({ title, count, items, color, retryTaskIds, retryDelays, now }, ref) {
  const showRetry = retryTaskIds && retryDelays && now !== undefined
  return (
    <div
      ref={ref}
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">{title}</span>
        <span className="font-mono text-slate-800 dark:text-slate-200">{count}</span>
      </div>
      <motion.div
        className="flex flex-wrap gap-1"
        variants={{
          visible: { transition: { staggerChildren: 0.015 } },
          hidden: {},
        }}
        initial="hidden"
        animate="visible"
      >
        {Array.from({ length: items }).map((_, i) => {
          if (showRetry && retryTaskIds[i]) {
            const delay = retryDelays[retryTaskIds[i]] || 0
            const remaining = Math.max(0, Math.ceil((delay - now) / 1000))
            return (
              <motion.div
                key={retryTaskIds[i]}
                variants={{
                  hidden: { opacity: 0, scale: 0, y: 4 },
                  visible: { opacity: 1, scale: 1, y: 0 },
                }}
                layout
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`min-w-[1.5rem] h-6 rounded-sm ${color} flex items-center justify-center px-1 text-[10px] text-white font-medium`}
                title={`Retry in ${remaining}s`}
              >
                {remaining}s
              </motion.div>
            )
          }
          return (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, scale: 0, y: 4 },
                visible: { opacity: 1, scale: 1, y: 0 },
              }}
              layout
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`w-3 h-3 rounded-sm ${color}`}
            />
          )
        })}
        {count > items && (
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">+{count - items}</span>
        )}
      </motion.div>
    </div>
  )
})

function WorkerDot({
  worker,
  task,
  now,
  simulationSpeed,
  reducedMotion,
  workerRefs,
  flash,
  strategy,
  onKillWorker,
  onHealWorker,
  onFailTask,
}: {
  worker: Worker
  task?: Task
  now: number
  simulationSpeed: number
  reducedMotion: boolean
  workerRefs: React.RefObject<Map<string, HTMLDivElement>>
  flash?: boolean
  strategy?: LoadBalancingStrategy
  onKillWorker?: (workerId: string) => void
  onHealWorker?: (workerId: string) => void
  onFailTask?: (taskId: string) => void
}) {
  const isUnhealthy = !worker.healthy
  const progress =
    task && task.startedAt
      ? Math.min(1, (now - task.startedAt) / (task.duration / simulationSpeed))
      : 0
  const radius = 16
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)
  const [hovered, setHovered] = useState(false)

  const setRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (el) workerRefs.current.set(worker.id, el)
    },
    [worker.id, workerRefs],
  )

  return (
    <motion.div
      ref={setRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      animate={
        reducedMotion
          ? {}
          : {
              scale: worker.busy ? 1.05 : 1,
              backgroundColor: isUnhealthy ? '#f43f5e' : worker.busy ? '#f59e0b' : '#cbd5e1',
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
        className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[6px] leading-none ${profileColors[worker.profile]} ${profileShapes[worker.profile]}`}
        aria-hidden="true"
        title={worker.profile}
      >
        {profileLabels[worker.profile]}
      </span>
      {isUnhealthy && (
        <span className="absolute -bottom-1 text-[8px] text-rose-600 font-bold">CB</span>
      )}
      {worker.busy && task && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 40 40"
        >
          <circle
            cx="20"
            cy="20"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.8)"
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
      )}
      {flash && (
        <motion.span
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-md ring-2 ring-sky-400 pointer-events-none"
        />
      )}
      {flash && strategy && (
        <motion.span
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6 }}
          className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-sky-500 bg-slate-900/80 px-1 rounded pointer-events-none whitespace-nowrap"
        >
          {strategyLabels[strategy]}
        </motion.span>
      )}
      {hovered && (onKillWorker || onHealWorker || onFailTask) && (
        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-1">
          {onKillWorker && worker.healthy && (
            <button
              onClick={() => onKillWorker(worker.id)}
              className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-medium shadow"
            >
              Kill
            </button>
          )}
          {onHealWorker && !worker.healthy && (
            <button
              onClick={() => onHealWorker(worker.id)}
              className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-medium shadow"
            >
              Heal
            </button>
          )}
          {onFailTask && worker.busy && worker.currentTaskId && (
            <button
              onClick={() => onFailTask(worker.currentTaskId!)}
              className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-medium shadow"
            >
              Fail Task
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
