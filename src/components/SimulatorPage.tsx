import { useState, useCallback } from 'react'
import { useSimulation } from '../hooks/useSimulation.tsx'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useFullscreen } from '../hooks/useFullscreen'
import { useShareableUrl } from '../hooks/useShareableUrl'
import { TopBar } from './TopBar'
import { ControlPanel } from './ControlPanel'
import { Visualization } from './Visualization'
import { MetricsPanel } from './MetricsPanel'
import { TaskTable } from './TaskTable'
import { EventLog } from './EventLog'
import { BottleneckAlert } from './BottleneckAlert'
import { DLQInspector } from './DLQInspector'
import toast from 'react-hot-toast'

export function SimulatorPage() {
  const {
    state,
    start,
    pause,
    reset,
    addTasks,
    addBatch,
    updateConfig,
    snapshotsCount,
    rewindTo,
    exitRewind,
    isRewind,
    exportState,
    importState,
    showDLQFromToast,
    setShowDLQFromToast,
    audioConsent,
    setAudioConsent,
  } = useSimulation()
  const [bottomTab, setBottomTab] = useState<'tasks' | 'events'>('tasks')
  const [showDLQ, setShowDLQ] = useState(false)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()

  useShareableUrl(state.config)

  useKeyboardShortcuts({
    onTogglePlay: () => (state.isRunning ? pause() : start()),
    onReset: reset,
    onAddTasks: addTasks,
  })

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('URL copied to clipboard')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden">
      <TopBar
        isRunning={state.isRunning}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onAddTasks={addTasks}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onCopyUrl={copyUrl}
      />

      <BottleneckAlert stage={state.bottleneck} />

      <div className={`flex flex-1 overflow-hidden ${isFullscreen ? 'fullscreen-demo' : ''}`}>
        <aside
          className={`border-r border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 overflow-hidden flex flex-col ${isFullscreen ? 'w-16' : 'w-64'}`}
        >
          <ControlPanel
            config={state.config}
            onChange={updateConfig}
            onAddBatch={addBatch}
            snapshotsCount={snapshotsCount}
            rewindTo={rewindTo}
            exitRewind={exitRewind}
            isRewind={isRewind}
            isFullscreen={isFullscreen}
            audioConsent={audioConsent}
            onToggleAudio={() => setAudioConsent(!audioConsent)}
          />
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
                maxQueueCapacity={state.config.maxQueueCapacity}
              />
            </div>
            {!isFullscreen && (
              <aside className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 overflow-y-auto">
                <MetricsPanel
                  metrics={state.metrics}
                  metricsHistory={state.metricsHistory}
                  workerUtilization={state.workerUtilization}
                  onExport={exportState}
                  onImport={importState}
                />
              </aside>
            )}
          </div>

          <div
            className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 overflow-hidden flex flex-col ${isFullscreen ? 'h-40' : 'h-64'}`}
          >
            <div className="flex items-center gap-1 px-4 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setBottomTab('tasks')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  bottomTab === 'tasks'
                    ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setBottomTab('events')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  bottomTab === 'events'
                    ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Event Log
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowDLQ(true)}
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                DLQ Inspector
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {bottomTab === 'tasks' ? (
                <TaskTable tasks={state.tasks} />
              ) : (
                <EventLog events={state.events} />
              )}
            </div>
          </div>
        </main>
      </div>

      {(showDLQ || showDLQFromToast) && (
        <DLQInspector
          tasks={state.tasks}
          deadLetterQueue={state.deadLetterQueue}
          onClose={() => {
            setShowDLQ(false)
            setShowDLQFromToast(false)
          }}
        />
      )}
    </div>
  )
}
