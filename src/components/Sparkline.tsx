import { useEffect, useRef } from 'react'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  color = '#38bdf8',
  fill = true,
}: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
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

    if (fill) {
      ctx.lineTo(getX(data.length - 1), height)
      ctx.lineTo(getX(0), height)
      ctx.closePath()
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, color + '33')
      gradient.addColorStop(1, color + '00')
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }, [data, width, height, color, fill])

  return <canvas ref={canvasRef} className="block" />
}
