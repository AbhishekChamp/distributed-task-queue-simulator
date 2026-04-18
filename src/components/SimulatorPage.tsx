import { useState, useCallback, Suspense, lazy, useEffect, useRef, useMemo } from 'react'
import { useSimulation } from '../hooks/useSimulation.tsx'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useFullscreen } from '../hooks/useFullscreen'
import { useShareableUrl } from '../hooks/useShareableUrl'
import { useConfigHistory } from '../hooks/useConfigHistory'
import { useAutoSave, loadCrashRecovery, clearCrashRecovery } from '../hooks/useAutoSave'
import { useViewTransition } from '../hooks/useViewTransition'
import { TopBar } from './TopBar'
import { ControlPanel } from './ControlPanel'
import { Visualization } from './Visualization'
import { BottleneckAlert } from './BottleneckAlert'
import { useGuidedTour } from '../hooks/useGuidedTour'
import { GuidedTourOverlay } from './GuidedTour'
import { useChallenges } from '../hooks/useChallenges'
import { ChallengesButton, ChallengesPanel } from './ScenarioChallenges'
import { StepThroughDebugger } from './StepThroughDebugger'
import { BottomSheet } from './BottomSheet'
import { CommandPalette } from './CommandPalette'
import { GlossaryDrawer } from './GlossaryDrawer'
import { setSimulationState } from '../store/useSimulationStore'
import type { SimulationConfig } from '../types'
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
    step,
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
    snapshots,
    showDLQFromToast,
    setShowDLQFromToast,
    audioConsent,
    setAudioConsent,
    killWorker,
    healWorker,
    failTask,
    cancelTasks,
    retryTasks,
  } = useSimulation()
  const [bottomTab, setBottomTab] = useState<'tasks' | 'events' | 'debug'>('tasks')
  const [showDLQ, setShowDLQ] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [metricsSheetOpen, setMetricsSheetOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const withTransition = useViewTransition()

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
  const [liveMessage, setLiveMessage] = useState('')

  useAutoSave(state, 5000)

  useEffect(() => {
    const recovered = loadCrashRecovery()
    if (recovered && recovered.tasks && recovered.tasks.size > 0) {
      toast(
        <div className="flex flex-col gap-1">
          <span>Crash recovery session found</span>
          <button
            onClick={() => {
              setSimulationState({ ...recovered, isRunning: false })
              clearCrashRecovery()
              toast.success('Session restored')
            }}
            className="text-left text-xs underline text-slate-300 hover:text-white"
          >
            Restore Session
          </button>
          <button
            onClick={() => {
              clearCrashRecovery()
              toast.success('Recovered session discarded')
            }}
            className="text-left text-xs underline text-slate-300 hover:text-white"
          >
            Discard
          </button>
        </div>,
        { duration: 10000, id: 'crash-recovery' },
      )
    }
  }, [])

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

  useEffect(() => {
    const lastEvent = state.events[state.events.length - 1]
    if (!lastEvent) return
    if (
      lastEvent.type === 'SYSTEM_OVERLOAD' ||
      lastEvent.type === 'BACKPRESSURE_APPLIED' ||
      lastEvent.type === 'WORKER_UNHEALTHY' ||
      lastEvent.type === 'ALL_TASKS_COMPLETED'
    ) {
      const msg = lastEvent.message || lastEvent.type
      queueMicrotask(() => setLiveMessage(msg))
      const t = setTimeout(() => setLiveMessage(''), 1000)
      return () => clearTimeout(t)
    }
  }, [state.events])

  useShareableUrl(state.config)

  const { push: pushConfigHistory, undo, redo, canUndo, canRedo } = useConfigHistory(updateConfig)

  const handleUpdateConfig = useCallback(
    (patch: Partial<SimulationConfig>) => {
      const next = { ...state.config, ...patch }
      pushConfigHistory(next)
      updateConfig(patch)
    },
    [state.config, pushConfigHistory, updateConfig],
  )

  const setBottomTabWithTransition = useCallback(
    (tab: 'tasks' | 'events' | 'debug') => {
      withTransition(() => setBottomTab(tab))
    },
    [withTransition],
  )

  const setShowDLQWithTransition = useCallback(
    (val: boolean) => {
      withTransition(() => setShowDLQ(val))
    },
    [withTransition],
  )

  const shortcuts = useMemo(
    () => ({
      onTogglePlay: () => (state.isRunning ? pause() : start()),
      onReset: reset,
      onAddTasks: addTasks,
      onUndo: undo,
      onRedo: redo,
      onOpenCommandPalette: () => setCommandPaletteOpen(true),
    }),
    [state.isRunning, pause, start, reset, addTasks, undo, redo],
  )

  useKeyboardShortcuts(shortcuts)

  const copyUrl = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('URL copied to clipboard')
  }, [])

  const commandPaletteCommands = useMemo(
    () => [
      {
        id: 'start',
        label: state.isRunning ? 'Pause Simulation' : 'Start Simulation',
        shortcut: 'Space',
        action: () => (state.isRunning ? pause() : start()),
      },
      { id: 'reset', label: 'Reset Simulation', shortcut: 'R', action: reset },
      { id: 'dlq', label: 'Open DLQ Inspector', action: () => setShowDLQWithTransition(true) },
      {
        id: 'steady',
        label: 'Apply Preset: Steady State',
        action: () => {
          handleUpdateConfig({
            workerCount: 4,
            failureProbability: 5,
            maxRetries: 2,
            simulationSpeed: 1,
            baseProcessingTime: 800,
            maxQueueCapacity: 200,
            loadBalancingStrategy: 'round-robin',
            enableCircuitBreaker: true,
            maxTasksPerSecondPerWorker: 0,
            durationDistribution: 'uniform',
            enableAutoScaling: false,
            autoScalingQueueThreshold: 50,
            networkLatencyMs: 0,
            networkJitterMs: 0,
          })
          toast.success('Preset applied: Steady State')
        },
      },
      {
        id: 'chaos',
        label: 'Apply Preset: Chaos Mode',
        action: () => {
          handleUpdateConfig({
            workerCount: 6,
            failureProbability: 60,
            maxRetries: 5,
            simulationSpeed: 2,
            baseProcessingTime: 500,
            maxQueueCapacity: 300,
            loadBalancingStrategy: 'random',
            enableCircuitBreaker: true,
            maxTasksPerSecondPerWorker: 0,
            durationDistribution: 'exponential',
            enableAutoScaling: false,
            autoScalingQueueThreshold: 50,
            networkLatencyMs: 0,
            networkJitterMs: 0,
          })
          toast.success('Preset applied: Chaos Mode')
        },
      },
      {
        id: 'glossary',
        label: 'Open Glossary',
        action: () => withTransition(() => setGlossaryOpen(true)),
      },
      {
        id: 'fullscreen',
        label: isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen',
        action: toggleFullscreen,
      },
      {
        id: 'theme',
        label: 'Toggle Theme',
        action: () => {
          const html = document.documentElement
          const isDark = html.classList.contains('dark')
          if (isDark) html.classList.remove('dark')
          else html.classList.add('dark')
        },
      },
    ],
    [
      state.isRunning,
      pause,
      start,
      reset,
      handleUpdateConfig,
      isFullscreen,
      toggleFullscreen,
      setShowDLQWithTransition,
      withTransition,
    ],
  )

  const bottleneckMetrics = useMemo(
    () => ({
      queued: state.metrics.queued,
      activeWorkers: state.metrics.activeWorkers,
      workerCount: state.config.workerCount,
      maxQueueCapacity: state.config.maxQueueCapacity,
      tasksPerSecond: state.metrics.tasksPerSecond,
      baseProcessingTime: state.config.baseProcessingTime,
    }),
    [state.metrics, state.config],
  )

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
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        challengeButton={
          <ChallengesButton completedCount={completedCount} onClick={() => setShowPanel(true)} />
        }
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenGlossary={() => withTransition(() => setGlossaryOpen(true))}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <BottleneckAlert
        id="bottleneck-alert"
        stage={state.bottleneck}
        metrics={bottleneckMetrics}
        onApplyFix={handleUpdateConfig}
      />

      <div className={`flex flex-1 overflow-hidden ${isFullscreen ? 'fullscreen-demo' : ''}`}>
        <aside
          id="control-panel"
          className={`border-r border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 overflow-hidden flex flex-col ${
            isFullscreen ? 'w-16' : 'w-64'
          } ${sidebarOpen ? 'absolute inset-y-0 left-0 z-40 shadow-2xl lg:static lg:shadow-none' : 'hidden lg:flex'}`}
        >
          <ControlPanel
            config={state.config}
            onChange={handleUpdateConfig}
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
              className="@container flex-1 p-6 overflow-y-auto"
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
                simulationSpeed={state.config.simulationSpeed}
                events={state.events}
                retryDelays={state.retryDelays}
                strategy={state.config.loadBalancingStrategy}
                onKillWorker={killWorker}
                onHealWorker={healWorker}
                onFailTask={failTask}
              />
            </div>
            {!isFullscreen && (
              <>
                <aside
                  id="metrics-panel"
                  className="@container hidden lg:block w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/50 overflow-y-auto"
                >
                  <Suspense fallback={<PanelSkeleton />}>
                    <MetricsPanel
                      metrics={state.metrics}
                      metricsHistory={state.metricsHistory}
                      workerUtilization={state.workerUtilization}
                      tasks={state.tasks}
                      events={state.events}
                      snapshots={snapshots}
                      onExport={exportState}
                      onImport={importState}
                    />
                  </Suspense>
                </aside>
                <button
                  onClick={() => setMetricsSheetOpen(true)}
                  className="lg:hidden fixed bottom-4 right-4 z-30 px-3 py-2 rounded-full bg-sky-600 text-white text-xs font-semibold shadow-lg"
                >
                  Metrics
                </button>
              </>
            )}
          </div>

          <div
            id="bottom-panel"
            className={`border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 overflow-hidden flex flex-col ${isFullscreen ? 'h-40' : 'h-64'}`}
          >
            <div className="flex items-center gap-1 px-4 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setBottomTabWithTransition('tasks')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  bottomTab === 'tasks'
                    ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setBottomTabWithTransition('events')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  bottomTab === 'events'
                    ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Event Log
              </button>
              <button
                onClick={() => setBottomTabWithTransition('debug')}
                className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider transition ${
                  bottomTab === 'debug'
                    ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                    : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                Debug
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setShowDLQWithTransition(true)}
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
                  <TaskTable
                    tasks={state.tasks}
                    events={state.events}
                    onCancelTasks={cancelTasks}
                    onRetryTasks={retryTasks}
                  />
                ) : bottomTab === 'events' ? (
                  <EventLog events={state.events} />
                ) : (
                  <StepThroughDebugger isRunning={state.isRunning} onStep={step} />
                )}
              </Suspense>
            </div>
          </div>
        </main>
      </div>

      {metricsSheetOpen && !isFullscreen && (
        <BottomSheet
          isOpen={metricsSheetOpen}
          onClose={() => setMetricsSheetOpen(false)}
          title="Metrics"
        >
          <MetricsPanel
            metrics={state.metrics}
            metricsHistory={state.metricsHistory}
            workerUtilization={state.workerUtilization}
            tasks={state.tasks}
            events={state.events}
            snapshots={snapshots}
            onExport={exportState}
            onImport={importState}
          />
        </BottomSheet>
      )}

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

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commandPaletteCommands}
      />

      <GlossaryDrawer isOpen={glossaryOpen} onClose={() => setGlossaryOpen(false)} />

      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>
    </div>
  )
}
