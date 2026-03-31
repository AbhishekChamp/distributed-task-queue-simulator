import { useSimulation } from '../hooks/useSimulation'
import { TopBar } from './TopBar'
import { ControlPanel } from './ControlPanel'
import { Visualization } from './Visualization'
import { MetricsPanel } from './MetricsPanel'
import { TaskTable } from './TaskTable'

export function SimulatorPage() {
  const { state, start, pause, reset, addTasks, updateConfig } = useSimulation()

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <TopBar
        isRunning={state.isRunning}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onAddTasks={addTasks}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-slate-800 bg-slate-900/50 overflow-y-auto">
          <ControlPanel config={state.config} onChange={updateConfig} />
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto">
              <Visualization
                tasks={state.tasks}
                workers={state.workers}
                mainQueue={state.mainQueue}
                retryQueue={state.retryQueue}
                deadLetterQueue={state.deadLetterQueue}
              />
            </div>
            <aside className="w-72 border-l border-slate-800 bg-slate-900/50 overflow-y-auto">
              <MetricsPanel metrics={state.metrics} />
            </aside>
          </div>

          <div className="h-64 border-t border-slate-800 bg-slate-900/30 overflow-hidden">
            <TaskTable tasks={state.tasks} />
          </div>
        </main>
      </div>
    </div>
  )
}
