import { useState } from 'react'
import type { BottleneckStage, SimulationConfig } from '../types'

interface BottleneckAlertProps {
  stage: BottleneckStage
  id?: string
  metrics?: {
    queued: number
    activeWorkers: number
    workerCount: number
    maxQueueCapacity: number
    tasksPerSecond: number
    baseProcessingTime: number
  }
  onApplyFix?: (fix: Partial<SimulationConfig>) => void
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

function buildDiagnostics(
  stage: BottleneckStage,
  metrics?: BottleneckAlertProps['metrics'],
): { title: string; details: string; fix: Partial<SimulationConfig>; fixLabel: string } | null {
  if (!metrics) return null
  switch (stage) {
    case 'producer':
      return {
        title: 'Backpressure Threshold Crossed',
        details: `Queue is at or near capacity (${metrics.queued} / ${metrics.maxQueueCapacity}). New tasks are being dropped.`,
        fix: { maxQueueCapacity: Math.min(1000, metrics.maxQueueCapacity + 100) },
        fixLabel: 'Increase Queue Capacity',
      }
    case 'queue':
      return {
        title: 'Queue Depth Too High',
        details: `Queue depth (${metrics.queued}) exceeds healthy limits. Workers are not keeping up.`,
        fix: { workerCount: Math.min(20, metrics.workerCount + 2) },
        fixLabel: 'Add Workers',
      }
    case 'workers':
      return {
        title: 'Worker Saturation',
        details: `All ${metrics.workerCount} workers are busy and throughput (${Math.round(metrics.tasksPerSecond)} tps) is plateaued.`,
        fix: {
          workerCount: Math.min(20, metrics.workerCount + 2),
          baseProcessingTime: Math.max(200, Math.round(metrics.baseProcessingTime * 0.8)),
        },
        fixLabel: 'Add Workers & Speed Up',
      }
    default:
      return null
  }
}

export function BottleneckAlert({ stage, id, metrics, onApplyFix }: BottleneckAlertProps) {
  const msg = messages[stage]
  const [expanded, setExpanded] = useState(false)
  const diagnostics = buildDiagnostics(stage, metrics)

  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`mx-4 my-3 rounded-md border text-xs font-medium overflow-hidden ${msg.color}`}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-3 py-2 text-left flex items-center justify-between"
        aria-expanded={expanded}
      >
        <span>{msg.text}</span>
        <span className="text-[10px] opacity-70">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && diagnostics && (
        <div className="px-3 pb-3 border-t border-current/20">
          <div className="mt-2 space-y-1">
            <div className="font-semibold">{diagnostics.title}</div>
            <div className="opacity-90 text-[11px] leading-relaxed">{diagnostics.details}</div>
          </div>
          {onApplyFix && (
            <button
              onClick={() => onApplyFix(diagnostics.fix)}
              className="mt-2 px-2 py-1 rounded bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/20 dark:hover:bg-white/20 transition text-[11px] font-semibold"
            >
              Apply Fix: {diagnostics.fixLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
