import { useState, useEffect, useRef } from 'react'
import type { SimulationState } from '../types'
import { setSimulationState } from '../store/useSimulationStore'

interface SessionReplayProps {
  snapshots: SimulationState[]
  onClose: () => void
}

export function SessionReplay({ snapshots, onClose }: SessionReplayProps) {
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (snapshots[index]) {
      setSimulationState({ ...snapshots[index], isRunning: false })
    }
  }, [index, snapshots])

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setIndex((i) => {
          if (i >= snapshots.length - 1) {
            setIsPlaying(false)
            return i
          }
          return i + 1
        })
      }, 100 / speed)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPlaying, snapshots.length, speed])

  const handleClose = () => {
    setIsPlaying(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Session Replay
          </h3>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Close
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Frame {index + 1} / {snapshots.length}
            </span>
            <span>Speed: {speed}x</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, snapshots.length - 1)}
            value={index}
            onChange={(e) => {
              setIsPlaying(false)
              setIndex(Number(e.target.value))
            }}
            className="w-full accent-sky-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying((p) => !p)}
            className="px-3 py-1.5 rounded-md bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={() => setIndex(0)}
            className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Reset
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s as 0.5 | 1 | 2)}
                className={`px-2 py-1 rounded text-xs ${
                  speed === s
                    ? 'bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
