import { useEffect, useState, useCallback } from 'react'

const TOUR_KEY = 'dtq-tour-completed'

export interface TourStep {
  targetId: string
  title: string
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export const tourSteps: TourStep[] = [
  {
    targetId: 'pipeline-section',
    title: 'Pipeline Visualization',
    content:
      'This is the heart of the simulator. Watch tasks flow from Producer → Main Queue → Workers → Results in real-time.',
    placement: 'bottom',
  },
  {
    targetId: 'control-panel',
    title: 'Controls',
    content:
      'Adjust worker count, failure probability, simulation speed, and queue capacity. Toggle circuit breakers and try different load balancing strategies.',
    placement: 'right',
  },
  {
    targetId: 'metrics-panel',
    title: 'Live Metrics',
    content:
      'Observe queue depth, tasks per second, latency percentiles, and worker utilization heatmaps as the simulation runs.',
    placement: 'left',
  },
  {
    targetId: 'bottom-panel',
    title: 'Event Log & Tasks',
    content:
      'Switch between the virtualized task table and the filtered event log. Inspect individual tasks and dead-letter queue entries.',
    placement: 'top',
  },
  {
    targetId: 'bottleneck-alert',
    title: 'Bottleneck Detection',
    content:
      'The simulator automatically detects whether the producer, queue, or workers are the bottleneck and alerts you in real-time.',
    placement: 'bottom',
  },
  {
    targetId: 'topbar',
    title: 'Simulation Controls',
    content:
      'Use Start/Pause, Reset, and quick-add buttons to drive the simulation. Try the scenario challenges from the trophy icon!',
    placement: 'bottom',
  },
]

export function useGuidedTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(TOUR_KEY) === 'true'
  })

  const startTour = useCallback(() => {
    setStepIndex(0)
    setIsOpen(true)
  }, [])

  const closeTour = useCallback(() => {
    setIsOpen(false)
    localStorage.setItem(TOUR_KEY, 'true')
    setHasSeenTour(true)
  }, [])

  const nextStep = useCallback(() => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex((i) => i + 1)
    } else {
      closeTour()
    }
  }, [stepIndex, closeTour])

  const prevStep = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1))
  }, [])

  useEffect(() => {
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        startTour()
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [hasSeenTour, startTour])

  return {
    isOpen,
    stepIndex,
    step: tourSteps[stepIndex],
    steps: tourSteps,
    hasSeenTour,
    startTour,
    closeTour,
    nextStep,
    prevStep,
  }
}
