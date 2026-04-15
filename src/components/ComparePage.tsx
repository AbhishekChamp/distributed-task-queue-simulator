import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMiniSimulation } from '../hooks/useMiniSimulation'
import { Visualization } from './Visualization'
import { MetricsPanel } from './MetricsPanel'

export function ComparePage() {
  const left = useMiniSimulation({ loadBalancingStrategy: 'round-robin' })
  const right = useMiniSimulation({ loadBalancingStrategy: 'least-connections' })
  const [leftRunning, setLeftRunning] = useState(false)
  const [rightRunning, setRightRunning] = useState(false)

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden">
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100">
            Comparative Mode
          </h1>
        </div>
        <Link
          to="/"
          className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm"
        >
          Back to Simulator
        </Link>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        <ComparisonPane
          title="Round Robin"
          sim={left}
          isRunning={leftRunning}
          setRunning={setLeftRunning}
        />
        <div className="hidden lg:block w-px bg-slate-200 dark:bg-slate-800" />
        <ComparisonPane
          title="Least Connections"
          sim={right}
          isRunning={rightRunning}
          setRunning={setRightRunning}
        />
      </main>
    </div>
  )
}

function ComparisonPane({
  title,
  sim,
  isRunning,
  setRunning,
}: {
  title: string
  sim: ReturnType<typeof useMiniSimulation>
  isRunning: boolean
  setRunning: (v: boolean) => void
}) {
  if (!sim.state) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading engine…</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isRunning) {
                sim.pause()
                setRunning(false)
              } else {
                sim.start()
                setRunning(true)
              }
            }}
            className="px-3 py-1 rounded-md bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 text-xs font-semibold"
          >
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={() => {
              sim.reset()
              setRunning(false)
            }}
            className="px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Reset
          </button>
          <button
            onClick={() => sim.addTasks(20)}
            className="px-3 py-1 rounded-md bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 text-xs font-semibold"
          >
            +20 Tasks
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Visualization
          tasks={sim.state.tasks}
          workers={sim.state.workers}
          mainQueue={sim.state.mainQueue}
          retryQueue={sim.state.retryQueue}
          deadLetterQueue={sim.state.deadLetterQueue}
          maxQueueCapacity={sim.state.config.maxQueueCapacity}
          simulationSpeed={sim.state.config.simulationSpeed}
          events={sim.state.events}
        />
      </div>

      <div className="h-48 border-t border-slate-200 dark:border-slate-800 overflow-auto lg:w-full">
        <MetricsPanel
          metrics={sim.state.metrics}
          metricsHistory={sim.state.metricsHistory}
          workerUtilization={sim.state.workerUtilization}
          tasks={sim.state.tasks}
          events={sim.state.events}
          snapshots={[]}
          onExport={() => {}}
          onImport={() => {}}
        />
      </div>
    </div>
  )
}
