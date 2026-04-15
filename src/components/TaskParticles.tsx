import { useEffect, useRef, useCallback } from 'react'
import type { Task, Worker, SimulationEvent } from '../types'

type ParticleType =
  | 'queue-to-worker'
  | 'worker-to-results'
  | 'worker-to-retry'
  | 'worker-to-dlq'
  | 'retry-to-queue'

interface Particle {
  id: string
  type: ParticleType
  x: number
  y: number
  tx: number
  ty: number
  progress: number
  speed: number
  color: string
}

interface TaskParticlesProps {
  tasks: Map<string, Task>
  workers: Worker[]
  events: SimulationEvent[]
  containerRef: React.RefObject<HTMLDivElement | null>
  queueRef: React.RefObject<HTMLDivElement | null>
  resultsRef: React.RefObject<HTMLDivElement | null>
  retryQueueCardRef: React.RefObject<HTMLDivElement | null>
  dlqCardRef: React.RefObject<HTMLDivElement | null>
  workerRefs: React.RefObject<Map<string, HTMLDivElement>>
  reducedMotion: boolean
}

export function TaskParticles({
  tasks,
  events,
  containerRef,
  queueRef,
  resultsRef,
  retryQueueCardRef,
  dlqCardRef,
  workerRefs,
  reducedMotion,
}: TaskParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | undefined>(undefined)
  const taskWorkerMap = useRef<Map<string, string>>(new Map())
  const prevTasksRef = useRef<Map<string, Task>>(new Map())

  useEffect(() => {
    events.forEach((ev) => {
      if (ev.type === 'TASK_STARTED' && ev.taskId && ev.workerId) {
        taskWorkerMap.current.set(ev.taskId, ev.workerId)
      }
    })
  }, [events])

  const getCenter = useCallback(
    (el: HTMLElement) => {
      const rect = el.getBoundingClientRect()
      const container = containerRef.current?.getBoundingClientRect()
      if (!container) return { x: 0, y: 0 }
      return {
        x: rect.left + rect.width / 2 - container.left,
        y: rect.top + rect.height / 2 - container.top,
      }
    },
    [containerRef],
  )

  useEffect(() => {
    if (reducedMotion || !canvasRef.current) return

    const prevTasks = prevTasksRef.current
    const newParticles: Particle[] = []

    tasks.forEach((task, id) => {
      const prev = prevTasks.get(id)
      if (!prev || prev.status === task.status) return

      const workerId = taskWorkerMap.current.get(id)
      const wEl = workerId ? workerRefs.current.get(workerId) : undefined
      const color = task.priority >= 2 ? '#f43f5e' : task.priority === 1 ? '#f59e0b' : '#10b981'

      if (prev.status === 'queued' && task.status === 'processing') {
        const qEl = queueRef.current
        if (qEl && wEl) {
          const start = getCenter(qEl)
          const end = getCenter(wEl)
          newParticles.push({
            id: `${id}-qw-${Date.now()}`,
            type: 'queue-to-worker',
            x: start.x,
            y: start.y,
            tx: end.x,
            ty: end.y,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            color,
          })
        }
      } else if (prev.status === 'processing' && task.status === 'success') {
        const rEl = resultsRef.current
        if (wEl && rEl) {
          const start = getCenter(wEl)
          const end = getCenter(rEl)
          newParticles.push({
            id: `${id}-wr-${Date.now()}`,
            type: 'worker-to-results',
            x: start.x,
            y: start.y,
            tx: end.x,
            ty: end.y,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            color,
          })
        }
      } else if (prev.status === 'processing' && task.status === 'retry') {
        const rqEl = retryQueueCardRef.current
        if (wEl && rqEl) {
          const start = getCenter(wEl)
          const end = getCenter(rqEl)
          newParticles.push({
            id: `${id}-wry-${Date.now()}`,
            type: 'worker-to-retry',
            x: start.x,
            y: start.y,
            tx: end.x,
            ty: end.y,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            color,
          })
        }
      } else if (prev.status === 'processing' && task.status === 'dead') {
        const dEl = dlqCardRef.current
        if (wEl && dEl) {
          const start = getCenter(wEl)
          const end = getCenter(dEl)
          newParticles.push({
            id: `${id}-wdlq-${Date.now()}`,
            type: 'worker-to-dlq',
            x: start.x,
            y: start.y,
            tx: end.x,
            ty: end.y,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            color,
          })
        }
      } else if (prev.status === 'retry' && task.status === 'queued') {
        const rqEl = retryQueueCardRef.current
        const qEl = queueRef.current
        if (rqEl && qEl) {
          const start = getCenter(rqEl)
          const end = getCenter(qEl)
          newParticles.push({
            id: `${id}-rq-${Date.now()}`,
            type: 'retry-to-queue',
            x: start.x,
            y: start.y,
            tx: end.x,
            ty: end.y,
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            color,
          })
        }
      }
    })

    if (newParticles.length > 0) {
      particlesRef.current = [...particlesRef.current, ...newParticles].slice(-100)
    }

    prevTasksRef.current = new Map(tasks)
  }, [
    tasks,
    queueRef,
    resultsRef,
    retryQueueCardRef,
    dlqCardRef,
    workerRefs,
    getCenter,
    reducedMotion,
  ])

  useEffect(() => {
    if (reducedMotion) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = Math.floor(rect.width * dpr)
        canvas.height = Math.floor(rect.height * dpr)
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }
    }
    resize()

    const animate = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, width, height)

      particlesRef.current = particlesRef.current.filter((p) => {
        p.progress += p.speed
        if (p.progress >= 1) return false

        const x = p.x + (p.tx - p.x) * p.progress
        const y = p.y + (p.ty - p.y) * p.progress

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()

        return true
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    window.addEventListener('resize', resize)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [reducedMotion])

  if (reducedMotion) return null

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-20" />
}
