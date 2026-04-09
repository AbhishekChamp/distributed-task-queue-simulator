import { useEffect, useRef, useCallback, useState } from 'react'
import type { SimulationConfig, SimulationState } from '../types'

export function useMiniSimulation(initialConfig?: Partial<SimulationConfig>) {
  const workerRef = useRef<Worker | null>(null)
  const [state, setState] = useState<SimulationState | null>(null)

  useEffect(() => {
    const worker = new Worker(new URL('../workers/simulation.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'STATE') {
        setState(e.data.state)
      }
    }

    worker.postMessage({ type: 'INIT', payload: { config: initialConfig } })

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [initialConfig])

  const start = useCallback(() => workerRef.current?.postMessage({ type: 'START' }), [])
  const pause = useCallback(() => workerRef.current?.postMessage({ type: 'PAUSE' }), [])
  const reset = useCallback(() => workerRef.current?.postMessage({ type: 'RESET' }), [])
  const addTasks = useCallback(
    (count: number) => workerRef.current?.postMessage({ type: 'ADD_TASKS', payload: { count } }),
    [],
  )
  const updateConfig = useCallback((config: Partial<SimulationConfig>) => {
    workerRef.current?.postMessage({ type: 'UPDATE_CONFIG', payload: { config } })
  }, [])

  return { state, start, pause, reset, addTasks, updateConfig }
}
