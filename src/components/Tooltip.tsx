import { useState, useRef, useEffect, type ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function Tooltip({ children, content, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return
    const tr = triggerRef.current.getBoundingClientRect()
    const tt = tooltipRef.current.getBoundingClientRect()
    let top = 0
    let left = 0

    switch (position) {
      case 'top':
        top = tr.top - tt.height - 6
        left = tr.left + tr.width / 2 - tt.width / 2
        break
      case 'bottom':
        top = tr.bottom + 6
        left = tr.left + tr.width / 2 - tt.width / 2
        break
      case 'left':
        top = tr.top + tr.height / 2 - tt.height / 2
        left = tr.left - tt.width - 6
        break
      case 'right':
        top = tr.top + tr.height / 2 - tt.height / 2
        left = tr.right + 6
        break
    }

    // Clamp to viewport
    const padding = 4
    top = Math.max(padding, Math.min(top, window.innerHeight - tt.height - padding))
    left = Math.max(padding, Math.min(left, window.innerWidth - tt.width - padding))

    setStyle({ top, left })
  }, [visible, position])

  return (
    <div
      ref={triggerRef}
      className="inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-2 py-1 text-xs rounded bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 shadow-lg pointer-events-none max-w-xs"
          style={style}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}
