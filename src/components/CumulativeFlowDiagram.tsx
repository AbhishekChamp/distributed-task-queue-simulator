import { useEffect, useRef } from 'react'
import type { MetricsHistoryPoint } from '../types'

interface CumulativeFlowDiagramProps {
  data: MetricsHistoryPoint[]
  width?: number
  height?: number
  'aria-label'?: string
}

export function CumulativeFlowDiagram({
  data,
  width = 280,
  height = 120,
  'aria-label': ariaLabel,
}: CumulativeFlowDiagramProps) {
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

    ctx.clearRect(0, 0, width, height)

    if (data.length < 2) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Collecting data…', width / 2, height / 2)
      return
    }

    const pad = { top: 8, right: 8, bottom: 20, left: 32 }
    const chartW = width - pad.left - pad.right
    const chartH = height - pad.top - pad.bottom

    const maxTotal = Math.max(
      ...data.map((d) => d.queued + d.processing + d.retry + d.dead + d.success),
    )
    const rangeY = maxTotal || 1

    const getX = (i: number) => pad.left + (i / (data.length - 1)) * chartW
    const getY = (v: number) => pad.top + chartH - (v / rangeY) * chartH

    const layers = [
      { key: 'success' as const, color: '#10b981' },
      { key: 'dead' as const, color: '#64748b' },
      { key: 'processing' as const, color: '#f59e0b' },
      { key: 'retry' as const, color: '#f97316' },
      { key: 'queued' as const, color: '#0ea5e9' },
    ]

    const cumulative = data.map(() => new Array(layers.length).fill(0))
    for (let i = 0; i < data.length; i++) {
      let sum = 0
      for (let j = 0; j < layers.length; j++) {
        sum += data[i][layers[j].key]
        cumulative[i][j] = sum
      }
    }

    for (let j = 0; j < layers.length; j++) {
      ctx.beginPath()
      ctx.moveTo(getX(0), getY(cumulative[0][j]))
      for (let i = 1; i < data.length; i++) {
        ctx.lineTo(getX(i), getY(cumulative[i][j]))
      }
      for (let i = data.length - 1; i >= 0; i--) {
        const prev = j > 0 ? cumulative[i][j - 1] : 0
        ctx.lineTo(getX(i), getY(prev))
      }
      ctx.closePath()
      ctx.fillStyle = layers[j].color + '66'
      ctx.fill()
      ctx.strokeStyle = layers[j].color
      ctx.lineWidth = 1.5
      ctx.stroke()
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
    ctx.fillText(String(maxTotal), pad.left - 4, pad.top)
    ctx.fillText('0', pad.left - 4, pad.top + chartH)
  }, [data, width, height])

  return <canvas ref={canvasRef} className="block" aria-label={ariaLabel} role="img" />
}
