import { motion, AnimatePresence } from 'framer-motion'
import type { Task, Worker } from '../types'

interface VisualizationProps {
  tasks: Map<string, Task>
  workers: Worker[]
  mainQueue: string[]
  retryQueue: string[]
  deadLetterQueue: string[]
}

export function Visualization({
  tasks,
  workers,
  mainQueue,
  retryQueue,
  deadLetterQueue,
}: VisualizationProps) {
  const mainCount = Math.min(mainQueue.length, 24)
  const retryCount = Math.min(retryQueue.length, 12)
  const dlqCount = Math.min(deadLetterQueue.length, 12)
  const isOverloaded = mainQueue.length > workers.length * 3

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pipeline</h2>

      <div className="flex items-center gap-4">
        <StageBox label="Producer" count={tasks.size} color="bg-violet-600" />
        <Arrow />
        <StageBox
          label="Main Queue"
          count={mainQueue.length}
          color={isOverloaded ? 'bg-rose-600' : 'bg-sky-600'}
          pulse={isOverloaded}
        />
        <Arrow />
        <StageBox
          label="Workers"
          count={workers.filter((w) => w.busy).length}
          color="bg-amber-600"
        />
        <Arrow />
        <StageBox
          label="Results"
          count={
            tasks.size > 0
              ? Math.max(
                  0,
                  tasks.size - mainQueue.length - retryQueue.length - deadLetterQueue.length,
                )
              : 0
          }
          color="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
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
        <h3 className="text-xs font-semibold text-slate-500">Worker Pool</h3>
        <div className="flex flex-wrap gap-2">
          {workers.map((worker) => (
            <motion.div
              key={worker.id}
              animate={{
                scale: worker.busy ? 1.05 : 1,
                backgroundColor: worker.busy ? '#f59e0b' : '#334155',
              }}
              className="w-10 h-10 rounded-md flex items-center justify-center text-xs font-bold text-slate-900"
              title={`${worker.id} | Processed: ${worker.processedCount}`}
            >
              {worker.id.split('-')[1]}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-slate-500">Live Tasks</h3>
        <div className="flex flex-wrap gap-1">
          <AnimatePresence>
            {Array.from(tasks.values())
              .filter((t) => t.status === 'processing')
              .slice(0, 30)
              .map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  className="w-6 h-6 rounded bg-amber-500"
                  title={task.id}
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
  count,
  color,
  pulse = false,
}: {
  label: string
  count: number
  color: string
  pulse?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-16 h-16 rounded-lg ${color} flex items-center justify-center text-white font-bold shadow-lg ${pulse ? 'animate-pulse' : ''}`}
      >
        {count}
      </div>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  )
}

function Arrow() {
  return <div className="text-slate-600 text-xl">→</div>
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
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">{title}</span>
        <span className="font-mono text-slate-200">{count}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
        ))}
        {count > items && <span className="text-xs text-slate-500 ml-1">+{count - items}</span>}
      </div>
    </div>
  )
}
