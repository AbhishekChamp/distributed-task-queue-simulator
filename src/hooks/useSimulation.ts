import { useEffect, useRef, useCallback, useState } from 'react'
import { setSimulationState, useSimulationStore } from '../store/useSimulationStore'
import type { SimulationConfig, SimulationEvent, SimulationState } from '../types'
import toast from 'react-hot-toast'

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

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null)
  const snapshotsRef = useRef<SimulationState[]>([])
  const [snapshotsCount, setSnapshotsCount] = useState(0)
  const [isRewind, setIsRewind] = useState(false)

  const handleEvent = useCallback((event: SimulationEvent) => {
    if (event.type === 'TASK_FAILED') {
      toast.error(`Task ${event.taskId?.slice(-6)} failed`, { duration: 1500 })
    }
    if (event.type === 'TASK_MOVED_TO_DLQ') {
      toast.error(`Task moved to DLQ: ${event.taskId?.slice(-6)}`, { duration: 2000 })
    }
    if (event.type === 'SYSTEM_OVERLOAD') {
      toast(`System overload: ${event.message}`, { icon: '⚠️', duration: 2500 })
    }
    if (event.type === 'BACKPRESSURE_APPLIED') {
      toast(`Backpressure: ${event.message}`, { icon: '🛑', duration: 3000 })
    }
    if (event.type === 'WORKER_UNHEALTHY') {
      toast.error(`Worker ${event.workerId} tripped circuit breaker`, { duration: 2000 })
    }
  }, [])

  useEffect(() => {
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
        }
      } else if (e.data.type === 'EVENT') {
        const event: SimulationEvent = e.data.event
        handleEvent(event)
      }
    }

    worker.postMessage({ type: 'INIT', payload: { config: stored } })

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [handleEvent, isRewind])

  const start = useCallback(() => {
    setIsRewind(false)
    const latest = snapshotsRef.current[snapshotsRef.current.length - 1]
    if (latest) setSimulationState(latest)
    workerRef.current?.postMessage({ type: 'START' })
  }, [])

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: 'PAUSE' })
  }, [])

  const reset = useCallback(() => {
    snapshotsRef.current = []
    setSnapshotsCount(0)
    setIsRewind(false)
    workerRef.current?.postMessage({ type: 'RESET' })
  }, [])

  const addTasks = useCallback((count: number) => {
    workerRef.current?.postMessage({ type: 'ADD_TASKS', payload: { count } })
  }, [])

  const addBatch = useCallback((batchSize: number) => {
    workerRef.current?.postMessage({ type: 'ADD_BATCH', payload: { batchSize } })
  }, [])

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
  }
}
