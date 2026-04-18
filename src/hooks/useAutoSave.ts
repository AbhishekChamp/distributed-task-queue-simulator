import { useEffect, useRef } from 'react'
import type { SimulationState } from '../types'

const KEY = 'dtq-crash-recovery'

function saveToStorage(state: SimulationState): void {
  try {
    const serializable = {
      ...state,
      tasks: Array.from(state.tasks.entries()),
    }
    localStorage.setItem(KEY, JSON.stringify(serializable))
  } catch {
    // ignore
  }
}

export function loadCrashRecovery(): Partial<SimulationState> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed.tasks && Array.isArray(parsed.tasks)) {
      parsed.tasks = new Map(parsed.tasks)
    }
    return parsed as Partial<SimulationState>
  } catch {
    return null
  }
}

export function clearCrashRecovery(): void {
  localStorage.removeItem(KEY)
}

export function useAutoSave(state: SimulationState, intervalMs = 5000) {
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  })

  useEffect(() => {
    const id = setInterval(() => {
      saveToStorage(stateRef.current)
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
