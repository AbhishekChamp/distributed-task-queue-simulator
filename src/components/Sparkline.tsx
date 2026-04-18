import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
  'aria-label'?: string
  onScrub?: (index: number, value: number) => void
  onLeave?: () => void
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = '#38bdf8',
  fill = true,
  'aria-label': ariaLabel,
  onScrub,
  onLeave,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const reducedMotion = useReducedMotion()
  const lastDataRef = useRef<number[]>([])

  useEffect(() => {
    if (reducedMotion) {
      // Only redraw if data length changed significantly (new point added)
      const last = lastDataRef.current
      if (last.length > 0 && data.length === last.length && data.every((v, i) => v === last[i])) {
        return
      }
    }
    lastDataRef.current = [...data]

    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1
    const pad = 2

    const getX = (i: number) => (i / (data.length - 1)) * (width - pad * 2) + pad
    const getY = (v: number) => height - pad - ((v - min) / range) * (height - pad * 2)

    ctx.clearRect(0, 0, width, height)
    ctx.beginPath()
    ctx.moveTo(getX(0), getY(data[0]))
    for (let i = 1; i < data.length; i++) {
      ctx.lineTo(getX(i), getY(data[i]))
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 2
    ctx.strokeStyle = color
    ctx.stroke()

    if (fill && !reducedMotion) {
      ctx.lineTo(getX(data.length - 1), height)
      ctx.lineTo(getX(0), height)
      ctx.closePath()
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, color + '33')
      gradient.addColorStop(1, color + '00')
      ctx.fillStyle = gradient
      ctx.fill()
    }

    if (hoverX != null && !reducedMotion) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(hoverX, 0)
      ctx.lineTo(hoverX, height)
      ctx.stroke()
    }
  }, [data, width, height, color, fill, hoverX, reducedMotion])

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onScrub || data.length < 2 || reducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pad = 2
    const chartW = width - pad * 2
    const ratio = Math.max(0, Math.min(1, (x - pad) / chartW))
    const index = Math.round(ratio * (data.length - 1))
    const clampedIndex = Math.max(0, Math.min(data.length - 1, index))
    setHoverX(x)
    onScrub(clampedIndex, data[clampedIndex])
  }

  const handleLeave = () => {
    setHoverX(null)
    onLeave?.()
  }

  return (
    <canvas
      ref={canvasRef}
      className={`block ${reducedMotion ? '' : 'cursor-crosshair'}`}
      aria-label={ariaLabel}
      role="img"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    />
  )
}
