import { useCallback, useState } from 'react'
import type { SimulationConfig } from '../types'

const MAX_HISTORY = 20

export function useConfigHistory(onUpdate: (config: Partial<SimulationConfig>) => void) {
  const [history, setHistory] = useState<SimulationConfig[]>([])
  const [index, setIndex] = useState(-1)

  const push = useCallback(
    (config: SimulationConfig) => {
      setHistory((prev) => {
        let next = prev
        const currentIndex = index
        if (currentIndex < next.length - 1) {
          next = next.slice(0, currentIndex + 1)
        }
        next = [...next, config]
        if (next.length > MAX_HISTORY) {
          next = next.slice(1)
        }
        return next
      })
      setIndex((prev) => {
        const nextIndex = prev + 1
        return nextIndex >= MAX_HISTORY ? MAX_HISTORY - 1 : nextIndex
      })
    },
    [index],
  )

  const undo = useCallback(() => {
    setIndex((prevIndex) => {
      const nextIndex = Math.max(0, prevIndex - 1)
      const prev = history[nextIndex]
      if (prev) onUpdate(prev)
      return nextIndex
    })
  }, [history, onUpdate])

  const redo = useCallback(() => {
    setIndex((prevIndex) => {
      const nextIndex = Math.min(history.length - 1, prevIndex + 1)
      const next = history[nextIndex]
      if (next) onUpdate(next)
      return nextIndex
    })
  }, [history, onUpdate])

  const canUndo = index > 0
  const canRedo = index >= 0 && index < history.length - 1

  return { push, undo, redo, canUndo, canRedo }
}
