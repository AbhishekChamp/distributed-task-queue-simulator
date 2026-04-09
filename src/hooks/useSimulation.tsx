import { useEffect, useRef, useCallback, useState } from 'react'
import { setSimulationState, useSimulationStore } from '../store/useSimulationStore'
import type { SimulationConfig, SimulationEvent, SimulationState } from '../types'
import toast from 'react-hot-toast'
import { useAudioFeedback } from './useAudioFeedback'
import { readConfigFromUrl } from './useShareableUrl'

const CONFIG_KEY = 'dtq-config'
const MAX_SNAPSHOTS = 120

function loadStoredConfig(): Partial<SimulationConfig> | undefined {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return JSON.parse(raw) as Partial<SimulationConfig>
  } catch {
    // ignore
  }
  return undefined
}

function saveConfig(config: SimulationConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null)
  const snapshotsRef = useRef<SimulationState[]>([])
  const [snapshotsCount, setSnapshotsCount] = useState(0)
  const [isRewind, setIsRewind] = useState(false)
  const [showDLQFromToast, setShowDLQFromToast] = useState(false)
  const audio = useAudioFeedback()

  const handleEvent = useCallback(
    (event: SimulationEvent) => {
      if (event.type === 'TASK_COMPLETED') {
        audio.playSuccess()
        return
      }
      if (event.type === 'TASK_FAILED') {
        audio.playFailure()
        toast.error(`Task ${event.taskId?.slice(-6)} failed`, { duration: 1500 })
        return
      }
      if (event.type === 'TASK_MOVED_TO_DLQ') {
        audio.playFailure()
        toast.error(
          <div className="flex flex-col gap-1">
            <span>Task moved to DLQ: {event.taskId?.slice(-6)}</span>
            <button
              onClick={() => setShowDLQFromToast(true)}
              className="text-left text-xs underline text-slate-300 hover:text-white"
            >
              Open DLQ Inspector
            </button>
          </div>,
          { duration: 3000 },
        )
        return
      }
      if (event.type === 'TASK_RETRIED') {
        toast(
          <div className="flex flex-col gap-1">
            <span>Retrying {event.taskId?.slice(-6)}</span>
            <span className="text-xs text-slate-400">{event.message}</span>
          </div>,
          { icon: '🔁', duration: 2000 },
        )
        return
      }
      if (event.type === 'SYSTEM_OVERLOAD') {
        toast(`System overload: ${event.message}`, { icon: '⚠️', duration: 2500 })
        return
      }
      if (event.type === 'BACKPRESSURE_APPLIED') {
        toast(`Backpressure: ${event.message}`, { icon: '🛑', duration: 3000 })
        return
      }
      if (event.type === 'WORKER_UNHEALTHY') {
        audio.playFailure()
        toast.error(`Worker ${event.workerId} tripped circuit breaker`, { duration: 2000 })
      }
    },
    [audio],
  )

  useEffect(() => {
    const urlConfig = readConfigFromUrl()
    const stored = loadStoredConfig()
    const worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'STATE') {
        const state: SimulationState = e.data.state
        if (!isRewind) {
          snapshotsRef.current.push(state)
          if (snapshotsRef.current.length > MAX_SNAPSHOTS) {
            snapshotsRef.current.shift()
          }
          setSnapshotsCount(snapshotsRef.current.length)
          setSimulationState(state)
          saveConfig(state.config)
        }
      } else if (e.data.type === 'EVENT') {
        const event: SimulationEvent = e.data.event
        handleEvent(event)
      }
    }

    worker.postMessage({ type: 'INIT', payload: { config: urlConfig ?? stored } })

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [handleEvent, isRewind])

  const start = useCallback(() => {
    audio.playClick()
    setIsRewind(false)
    const latest = snapshotsRef.current[snapshotsRef.current.length - 1]
    if (latest) setSimulationState(latest)
    workerRef.current?.postMessage({ type: 'START' })
  }, [audio])

  const pause = useCallback(() => {
    audio.playClick()
    workerRef.current?.postMessage({ type: 'PAUSE' })
  }, [audio])

  const step = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STEP' })
  }, [])

  const reset = useCallback(() => {
    audio.playClick()
    snapshotsRef.current = []
    setSnapshotsCount(0)
    setIsRewind(false)
    workerRef.current?.postMessage({ type: 'RESET' })
  }, [audio])

  const addTasks = useCallback(
    (count: number) => {
      audio.playClick()
      workerRef.current?.postMessage({ type: 'ADD_TASKS', payload: { count } })
    },
    [audio],
  )

  const addBatch = useCallback(
    (batchSize: number) => {
      audio.playClick()
      workerRef.current?.postMessage({ type: 'ADD_BATCH', payload: { batchSize } })
    },
    [audio],
  )

  const updateConfig = useCallback((config: Partial<SimulationConfig>) => {
    workerRef.current?.postMessage({ type: 'UPDATE_CONFIG', payload: { config } })
  }, [])

  const rewindTo = useCallback((index: number) => {
    setIsRewind(true)
    workerRef.current?.postMessage({ type: 'PAUSE' })
    const snapshot = snapshotsRef.current[index]
    if (snapshot) {
      setSimulationState({ ...snapshot, isRunning: false })
    }
  }, [])

  const exitRewind = useCallback(() => {
    setIsRewind(false)
    const latest = snapshotsRef.current[snapshotsRef.current.length - 1]
    if (latest) setSimulationState(latest)
  }, [])

  const exportState = useCallback(() => {
    const state = useSimulationStore.getState()
    const exportable = {
      ...state,
      tasks: Array.from(state.tasks.entries()),
      exportedAt: Date.now(),
    }
    const blob = new Blob([JSON.stringify(exportable, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulation-state-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('State exported')
  }, [])

  const importState = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          parsed.tasks = new Map(parsed.tasks)
        }
        workerRef.current?.postMessage({ type: 'PAUSE' })
        setSimulationState({ ...parsed, isRunning: false })
        toast.success('State imported')
      } catch {
        toast.error('Invalid state file')
      }
    }
    reader.readAsText(file)
  }, [])

  return {
    state: useSimulationStore(),
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
    showDLQFromToast,
    setShowDLQFromToast,
    audioConsent: audio.getConsent(),
    setAudioConsent: audio.setConsent,
  }
}
