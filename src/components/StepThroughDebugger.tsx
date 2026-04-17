import { useState } from 'react'

interface StepThroughDebuggerProps {
  isRunning: boolean
  onStep: () => void
}

const phases = [
  {
    id: 'recover',
    label: 'recoverWorkers()',
    desc: 'Restore healthy status for workers whose cooldown has expired.',
  },
  {
    id: 'retry',
    label: 'processRetryQueue()',
    desc: 'Move tasks whose backoff delay has elapsed back to the main queue.',
  },
  {
    id: 'assign',
    label: 'assignTasks()',
    desc: 'Pick idle workers and dequeue tasks according to the load-balancing strategy.',
  },
  {
    id: 'scale',
    label: 'autoScale()',
    desc: 'Add or remove workers based on queue depth thresholds.',
  },
  {
    id: 'metrics',
    label: 'updateMetrics()',
    desc: 'Recalculate throughput and sampling counters.',
  },
  {
    id: 'idle',
    label: 'checkIdleState()',
    desc: 'Pause the scheduler if all queues are empty and no worker is busy.',
  },
]

export function StepThroughDebugger({ isRunning, onStep }: StepThroughDebuggerProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleStep = () => {
    onStep()
    setActiveIndex((i) => (i + 1) % phases.length)
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Scheduler Step-Through
        </h3>
        <button
          onClick={handleStep}
          disabled={isRunning}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
            isRunning
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
              : 'bg-sky-600 text-white hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400'
          }`}
        >
          Step Tick
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-relaxed">
        <div className="text-slate-400">function tick() {'{'}</div>
        {phases.map((phase, idx) => {
          const isActive = idx === activeIndex
          return (
            <div
              key={phase.id}
              className={`pl-4 py-1 border-l-2 transition ${
                isActive
                  ? 'border-sky-500 bg-sky-500/10 text-sky-200'
                  : 'border-transparent text-slate-300'
              }`}
            >
              <span className={isActive ? 'font-semibold' : ''}>{phase.label}</span>
              {isActive && (
                <div className="mt-1 text-[10px] text-slate-400 font-sans">{phase.desc}</div>
              )}
            </div>
          )
        })}
        <div className="text-slate-400">{'}'}</div>
      </div>
    </div>
  )
}
