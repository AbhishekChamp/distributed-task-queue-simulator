import { useEffect, useRef } from 'react'
import type { Task } from '../types'

interface LatencyHistogramProps {
  tasks: Map<string, Task>
  width?: number
  height?: number
  'aria-label'?: string
}

export function LatencyHistogram({
  tasks,
  width = 280,
  height = 96,
  'aria-label': ariaLabel,
}: LatencyHistogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const completed = Array.from(tasks.values()).filter(
      (t) => t.status === 'success' || t.status === 'dead',
    )
    const durations = completed
      .map((t) => (t.completedAt || 0) - (t.startedAt || t.createdAt))
      .filter((d) => d > 0)

    ctx.clearRect(0, 0, width, height)

    if (durations.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No data yet', width / 2, height / 2)
      return
    }

    const bucketCount = 12
    const min = Math.min(...durations)
    const max = Math.max(...durations)
    const range = max - min || 1
    const buckets = new Array(bucketCount).fill(0)
    for (const d of durations) {
      const idx = Math.min(bucketCount - 1, Math.floor(((d - min) / range) * bucketCount))
      buckets[idx]++
    }
    const maxCount = Math.max(...buckets)
    const pad = { top: 8, right: 8, bottom: 20, left: 32 }
    const chartW = width - pad.left - pad.right
    const chartH = height - pad.top - pad.bottom
    const barW = (chartW / bucketCount) * 0.8
    const gap = (chartW / bucketCount) * 0.2

    // bars
    for (let i = 0; i < bucketCount; i++) {
      const h = maxCount > 0 ? (buckets[i] / maxCount) * chartH : 0
      const x = pad.left + i * (barW + gap) + gap / 2
      const y = pad.top + chartH - h
      const gradient = ctx.createLinearGradient(0, y, 0, y + h)
      gradient.addColorStop(0, '#38bdf8')
      gradient.addColorStop(1, '#0ea5e9')
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barW, h)
    }

    // axes
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(pad.left, pad.top)
    ctx.lineTo(pad.left, pad.top + chartH)
    ctx.lineTo(pad.left + chartW, pad.top + chartH)
    ctx.stroke()

    // y labels
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(maxCount), pad.left - 4, pad.top)
    ctx.fillText('0', pad.left - 4, pad.top + chartH)

    // x labels
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(`${Math.round(min)}ms`, pad.left, pad.top + chartH + 4)
    ctx.fillText(`${Math.round(max)}ms`, pad.left + chartW, pad.top + chartH + 4)
  }, [tasks, width, height])

  return <canvas ref={canvasRef} className="block" aria-label={ariaLabel} role="img" />
}
