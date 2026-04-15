import { useState, useEffect, useCallback } from 'react'
import type { SimulationMetrics, SimulationConfig } from '../types'

const CHALLENGES_KEY = 'dtq-challenges'

export interface Challenge {
  id: string
  title: string
  description: string
  objective: string
  check: (metrics: SimulationMetrics, config: SimulationConfig) => boolean
}

export const challenges: Challenge[] = [
  {
    id: 'steady-starter',
    title: 'Steady Starter',
    description: 'Get comfortable with the basics.',
    objective: 'Process 100 tasks with a failure rate below 5%.',
    check: (m) => m.success + m.failed + m.dead >= 100 && m.failureRate < 5,
  },
  {
    id: 'lean-machine',
    title: 'Lean Machine',
    description: 'Can a tiny team handle the load?',
    objective: 'Process 500 tasks using only 2 workers with <10% failure rate.',
    check: (m, c) =>
      m.success + m.failed + m.dead >= 500 && c.workerCount <= 2 && m.failureRate < 10,
  },
  {
    id: 'speed-demon',
    title: 'Speed Demon',
    description: 'Ramp up the tempo.',
    objective: 'Process 1,000 tasks at 5x speed or higher with <15% failure rate.',
    check: (m, c) =>
      m.success + m.failed + m.dead >= 1000 && c.simulationSpeed >= 5 && m.failureRate < 15,
  },
  {
    id: 'resilient-runner',
    title: 'Resilient Runner',
    description: 'Retries and circuit breakers are your friends.',
    objective: 'Process 500 tasks with 50% failure probability and 0 tasks in DLQ.',
    check: (m, c) =>
      m.success + m.failed + m.dead >= 500 && c.failureProbability >= 50 && m.dead === 0,
  },
  {
    id: 'zero-defect',
    title: 'Zero Defect',
    description: 'Perfection is possible.',
    objective: 'Process 200 tasks with exactly 0% failure rate.',
    check: (m) => m.success >= 200 && m.failed === 0 && m.dead === 0,
  },
]

export type ChallengeProgress = Record<string, boolean>

function loadProgress(): ChallengeProgress {
  try {
    const raw = localStorage.getItem(CHALLENGES_KEY)
    if (raw) return JSON.parse(raw) as ChallengeProgress
  } catch {
    // ignore
  }
  return {}
}

function saveProgress(progress: ChallengeProgress) {
  try {
    localStorage.setItem(CHALLENGES_KEY, JSON.stringify(progress))
  } catch {
    // ignore
  }
}

export function useChallenges(metrics: SimulationMetrics, config: SimulationConfig) {
  const [progress, setProgress] = useState<ChallengeProgress>(loadProgress)
  const [showPanel, setShowPanel] = useState(false)
  const [lastUnlocked, setLastUnlocked] = useState<string | null>(null)

  const checkChallenges = useCallback(() => {
    let unlockedTitle: string | null = null
    setProgress((prev) => {
      const next = { ...prev }
      let changed = false
      for (const ch of challenges) {
        if (!next[ch.id] && ch.check(metrics, config)) {
          next[ch.id] = true
          changed = true
          unlockedTitle = ch.title
        }
      }
      if (changed) {
        saveProgress(next)
      }
      return next
    })
    if (unlockedTitle) {
      setLastUnlocked(unlockedTitle)
    }
  }, [metrics, config])

  const resetProgress = useCallback(() => {
    saveProgress({})
    setProgress({})
    setLastUnlocked(null)
  }, [])

  useEffect(() => {
    if (lastUnlocked) {
      const t = setTimeout(() => setLastUnlocked(null), 3000)
      return () => clearTimeout(t)
    }
  }, [lastUnlocked])

  return {
    progress,
    showPanel,
    setShowPanel,
    lastUnlocked,
    checkChallenges,
    resetProgress,
    completedCount: Object.values(progress).filter(Boolean).length,
  }
}
