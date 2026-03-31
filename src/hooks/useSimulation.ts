import { useEffect, useRef, useCallback } from 'react'
import { SimulationEngine } from '../engine/simulation'
import { setSimulationState, useSimulationStore } from '../store/useSimulationStore'
import type { SimulationConfig, SimulationEvent } from '../types'
import toast from 'react-hot-toast'

export function useSimulation() {
  const engineRef = useRef<SimulationEngine | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    engineRef.current = new SimulationEngine()

    const handleEvent = (event: SimulationEvent) => {
      if (event.type === 'TASK_FAILED') {
        toast.error(`Task ${event.taskId?.slice(-6)} failed`, { duration: 1500 })
      }
      if (event.type === 'TASK_MOVED_TO_DLQ') {
        toast.error(`Task moved to DLQ: ${event.taskId?.slice(-6)}`, { duration: 2000 })
      }
      if (event.type === 'SYSTEM_OVERLOAD') {
        toast(`System overload: ${event.message}`, {
          icon: '⚠️',
          duration: 2500,
        })
      }
    }

    unsubscribeRef.current = engineRef.current.onEvent(handleEvent)

    const loop = () => {
      if (engineRef.current) {
        setSimulationState(engineRef.current.getState())
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (unsubscribeRef.current) unsubscribeRef.current()
      engineRef.current?.pause()
    }
  }, [])

  const start = useCallback(() => {
    engineRef.current?.start()
    if (engineRef.current) {
      setSimulationState(engineRef.current.getState())
    }
  }, [])

  const pause = useCallback(() => {
    engineRef.current?.pause()
    if (engineRef.current) {
      setSimulationState(engineRef.current.getState())
    }
  }, [])

  const reset = useCallback(() => {
    engineRef.current?.reset()
    if (engineRef.current) {
      setSimulationState(engineRef.current.getState())
    }
  }, [])

  const addTasks = useCallback((count: number) => {
    engineRef.current?.addTask(count)
  }, [])

  const updateConfig = useCallback((config: Partial<SimulationConfig>) => {
    engineRef.current?.updateConfig(config)
    if (engineRef.current) {
      setSimulationState(engineRef.current.getState())
    }
  }, [])

  return {
    state: useSimulationStore(),
    start,
    pause,
    reset,
    addTasks,
    updateConfig,
  }
}
