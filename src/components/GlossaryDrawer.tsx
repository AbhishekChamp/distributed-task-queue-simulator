import { useEffect, useRef } from 'react'

interface GlossaryDrawerProps {
  isOpen: boolean
  onClose: () => void
}

const concepts = [
  {
    term: 'Backpressure',
    icon: '🛑',
    summary: 'When the producer generates tasks faster than the system can process them.',
    detail:
      'Backpressure is a flow-control mechanism. In this simulator, when the main queue reaches its max capacity, new tasks are dropped to protect downstream workers from overload.',
  },
  {
    term: 'Circuit Breaker',
    icon: '⚡',
    summary: 'A self-healing safety switch that temporarily disables failing workers.',
    detail:
      'If a worker fails 3 consecutive tasks, the circuit breaker trips. The worker becomes unhealthy and enters a cooldown period before it can accept tasks again.',
  },
  {
    term: 'Dead Letter Queue (DLQ)',
    icon: '📭',
    summary: 'A holding area for tasks that have exhausted all retry attempts.',
    detail:
      'When a task fails more times than maxRetries allows, it is moved to the DLQ. These tasks are considered terminal failures and are removed from the active pipeline.',
  },
  {
    term: 'Exponential Backoff',
    icon: '⏳',
    summary: 'Retry delays that double with each failure to reduce system load.',
    detail:
      'After each failure, a task waits 2^retryCount × 500ms before re-entering the queue. This spacing prevents thundering-herd retries from overwhelming workers.',
  },
  {
    term: 'Load Balancing',
    icon: '⚖️',
    summary: 'Algorithms that decide which worker receives the next task.',
    detail:
      'Round Robin cycles through workers in order. Least Connections picks the worker with the fewest completed tasks. Random distributes tasks uniformly at random.',
  },
]

export function GlossaryDrawer({ isOpen, onClose }: GlossaryDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="glossary-title"
        className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="glossary-title"
            className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          >
            Glossary
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {concepts.map((c) => (
            <div
              key={c.term}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg" aria-hidden="true">
                  {c.icon}
                </span>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {c.term}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">{c.summary}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-500 leading-relaxed">
                {c.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
