import { useEffect, useRef } from 'react'
import type { WorkerUtilization } from '../types'

interface WorkerHeatmapCanvasProps {
  utilization: WorkerUtilization[]
  width?: number
  height?: number
}

const STATUS_COLORS: Record<string, string> = {
  busy: '#f59e0b',
  unhealthy: '#f43f5e',
  idle: '#94a3b8',
}

export function WorkerHeatmapCanvas({
  utilization,
  width = 280,
  height = 120,
}: WorkerHeatmapCanvasProps) {
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

    if (utilization.length === 0) {
      ctx.fillStyle = '#94a3b8'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('No utilization data yet', width / 2, height / 2)
      return
    }

    const rowHeight = Math.max(14, (height - 20) / utilization.length)
    const cellWidth = Math.max(2, (width - 60) / 60)
    const labelW = 50

    utilization.forEach((worker, row) => {
      const y = row * rowHeight + 4
      ctx.fillStyle = '#64748b'
      ctx.font = '10px monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(worker.workerId.slice(-4), 2, y + rowHeight / 2)

      worker.history.forEach((status, col) => {
        const x = labelW + col * cellWidth
        ctx.fillStyle = STATUS_COLORS[status] || STATUS_COLORS.idle
        ctx.fillRect(x, y, cellWidth - 0.5, rowHeight - 2)
      })
    })
  }, [utilization, width, height])

  return (
    <canvas ref={canvasRef} className="block" aria-label="Worker utilization heatmap" role="img" />
  )
}
