interface StepThroughDebuggerProps {
  isRunning: boolean
  onStep: () => void
}

export function StepThroughDebugger({ isRunning, onStep }: StepThroughDebuggerProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          Scheduler Step-Through
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manually advance the scheduler one tick at a time while the simulation is paused. Each
          tick runs worker recovery, retry queue processing, task assignment, metrics update, and
          idle state checks.
        </p>
        <button
          onClick={onStep}
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
    </div>
  )
}
