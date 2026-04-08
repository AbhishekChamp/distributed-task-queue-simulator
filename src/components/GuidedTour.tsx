import { useEffect, useState } from 'react'
import type { TourStep } from '../hooks/useGuidedTour'

export function GuidedTourOverlay({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
}: {
  step: TourStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onClose: () => void
}) {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    const updateRect = () => {
      const el = document.getElementById(step.targetId)
      if (el) {
        setRect(el.getBoundingClientRect())
      }
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    const id = setInterval(updateRect, 300)
    return () => {
      window.removeEventListener('resize', updateRect)
      clearInterval(id)
    }
  }, [step.targetId])

  if (!rect) return null

  const padding = 8
  const tooltipWidth = 320
  const tooltipHeight = 140

  let top = rect.top - tooltipHeight - padding * 2
  let left = rect.left + rect.width / 2 - tooltipWidth / 2

  if (step.placement === 'bottom') {
    top = rect.bottom + padding * 2
  } else if (step.placement === 'left') {
    top = rect.top + rect.height / 2 - tooltipHeight / 2
    left = rect.left - tooltipWidth - padding * 2
  } else if (step.placement === 'right') {
    top = rect.top + rect.height / 2 - tooltipHeight / 2
    left = rect.right + padding * 2
  }

  top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8))
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8))

  return (
    <div className="fixed inset-0 z-[100]" aria-hidden={false} role="dialog" aria-modal="true">
      {/* Dark overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx={8}
              ry={8}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.75)"
          mask="url(#tour-mask)"
          onClick={onClose}
        />
      </svg>

      {/* Highlight border */}
      <div
        className="absolute rounded-lg border-2 border-sky-500 pointer-events-none"
        style={{
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      />

      {/* Tooltip */}
      <div
        className="absolute bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-80"
        style={{ top, left }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">{step.title}</h3>
          <span className="text-xs text-slate-400">
            {stepIndex + 1} / {totalSteps}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{step.content}</p>
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                onClick={onPrev}
                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="px-3 py-1 rounded bg-sky-600 text-white text-xs hover:bg-sky-700 transition"
            >
              {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
