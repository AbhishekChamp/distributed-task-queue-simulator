import { useState, useCallback, Suspense, lazy, useEffect, useRef } from 'react'
import { useSimulation } from '../hooks/useSimulation.tsx'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useFullscreen } from '../hooks/useFullscreen'
import { useShareableUrl } from '../hooks/useShareableUrl'
import { TopBar } from './TopBar'
import { ControlPanel } from './ControlPanel'
import { Visualization } from './Visualization'
import { BottleneckAlert } from './BottleneckAlert'
import { useGuidedTour } from '../hooks/useGuidedTour'
import { GuidedTourOverlay } from './GuidedTour'
import { useChallenges } from '../hooks/useChallenges'
import { ChallengesButton, ChallengesPanel } from './ScenarioChallenges'
import toast from 'react-hot-toast'

const MetricsPanel = lazy(() => import('./MetricsPanel').then((m) => ({ default: m.MetricsPanel })))
const TaskTable = lazy(() => import('./TaskTable').then((m) => ({ default: m.TaskTable })))
const EventLog = lazy(() => import('./EventLog').then((m) => ({ default: m.EventLog })))
const DLQInspector = lazy(() => import('./DLQInspector').then((m) => ({ default: m.DLQInspector })))

function PanelSkeleton() {
  return (
    <div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800 p-4">
      <div className="h-4 w-1/3 bg-slate-300 dark:bg-slate-700 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-slate-300 dark:bg-slate-700 rounded" />
        <div className="h-3 w-5/6 bg-slate-300 dark:bg-slate-700 rounded" />
        <div className="h-3 w-4/6 bg-slate-300 dark:bg-slate-700 rounded" />
      </div>
    </div>
  )
}

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

  const tour = useGuidedTour()
  const challengeState = useChallenges(state.metrics, state.config)
  const {
    checkChallenges,
    lastUnlocked,
    completedCount,
    progress,
    showPanel,
    setShowPanel,
    resetProgress,
  } = challengeState
  const wasRunningRef = useRef(state.isRunning)

  useEffect(() => {
    if (wasRunningRef.current && !state.isRunning) {
      checkChallenges()
    }
    wasRunningRef.current = state.isRunning
  }, [state.isRunning, checkChallenges])

  useEffect(() => {
    if (lastUnlocked) {
      toast.success(`Challenge unlocked: ${lastUnlocked}!`, { icon: '🏆', duration: 3000 })
    }
  }, [lastUnlocked])

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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-sky-600 focus:text-white focus:px-3 focus:py-2 focus:rounded text-sm"
      >
        Skip to main content
      </a>
      <TopBar
        isRunning={state.isRunning}
        onStart={start}
        onPause={pause}
        onReset={reset}
        onAddTasks={addTasks}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onCopyUrl={copyUrl}
        onRestartTour={tour.startTour}
        challengeButton={
          <ChallengesButton completedCount={completedCount} onClick={() => setShowPanel(true)} />
        }
      />

      <BottleneckAlert id="bottleneck-alert" stage={state.bottleneck} />

      <div className={`flex flex-1 overflow-hidden ${isFullscreen ? 'fullscreen-demo' : ''}`}>
        <aside
          id="control-panel"
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

        <main id="main-content" className="flex-1 flex flex-col min-w-0" tabIndex={-1}>
          <div className="flex-1 flex overflow-hidden">
            <div
              id="pipeline-section"
              className="flex-1 p-6 overflow-y-auto"
              role="region"
              aria-label="Simulation visualization"
            >
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
              <aside
                id="metrics-panel"
                className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 overflow-y-auto"
              >
                <Suspense fallback={<PanelSkeleton />}>
                  <MetricsPanel
                    metrics={state.metrics}
                    metricsHistory={state.metricsHistory}
                    workerUtilization={state.workerUtilization}
                    onExport={exportState}
                    onImport={importState}
                  />
                </Suspense>
              </aside>
            )}
          </div>

          <div
            id="bottom-panel"
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
                    ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-slate-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Event Log
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowDLQ(true)}
                aria-label="Open Dead Letter Queue Inspector"
                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              >
                DLQ Inspector
              </button>
            </div>
            <div
              id="bottom-panel-content"
              role="tabpanel"
              aria-labelledby={bottomTab === 'tasks' ? 'tab-tasks' : 'tab-events'}
              className="flex-1 overflow-hidden"
            >
              <Suspense fallback={<PanelSkeleton />}>
                {bottomTab === 'tasks' ? (
                  <TaskTable tasks={state.tasks} />
                ) : (
                  <EventLog events={state.events} />
                )}
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {(showDLQ || showDLQFromToast) && (
        <Suspense fallback={null}>
          <DLQInspector
            tasks={state.tasks}
            deadLetterQueue={state.deadLetterQueue}
            onClose={() => {
              setShowDLQ(false)
              setShowDLQFromToast(false)
            }}
          />
        </Suspense>
      )}

      {tour.isOpen && (
        <GuidedTourOverlay
          step={tour.step}
          stepIndex={tour.stepIndex}
          totalSteps={tour.steps.length}
          onNext={tour.nextStep}
          onPrev={tour.prevStep}
          onClose={tour.closeTour}
        />
      )}

      {showPanel && (
        <ChallengesPanel
          progress={progress}
          onClose={() => setShowPanel(false)}
          onReset={resetProgress}
        />
      )}
    </div>
  )
}
