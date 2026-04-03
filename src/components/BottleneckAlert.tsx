import type { BottleneckStage } from '../types'

interface BottleneckAlertProps {
  stage: BottleneckStage
}

const messages: Record<BottleneckStage, { text: string; color: string }> = {
  producer: {
    text: '⚠️ Producer bottleneck: tasks are being dropped due to backpressure',
    color:
      'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
  },
  queue: {
    text: '⚠️ Queue bottleneck: backlog is piling up faster than workers can process',
    color:
      'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  },
  workers: {
    text: '⚠️ Worker bottleneck: all workers saturated, queue is growing',
    color:
      'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50',
  },
  none: {
    text: '✓ System operating within normal parameters',
    color:
      'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
  },
}

export function BottleneckAlert({ stage }: BottleneckAlertProps) {
  const msg = messages[stage]
  return (
    <div className={`mx-4 my-3 px-3 py-2 rounded-md border text-xs font-medium ${msg.color}`}>
      {msg.text}
    </div>
  )
}
