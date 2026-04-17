import { useState, useEffect, useRef, useCallback } from 'react'
import type { SimulationState } from '../types'
import { setSimulationState } from '../store/useSimulationStore'
import { saveBookmark, loadBookmarks, deleteBookmark } from '../lib/indexeddb'
import type { Bookmark } from '../types'

interface SessionReplayProps {
  snapshots: SimulationState[]
  onClose: () => void
}

export function SessionReplay({ snapshots, onClose }: SessionReplayProps) {
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [index, setIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [bookmarkName, setBookmarkName] = useState('')

  const refreshBookmarks = useCallback(async () => {
    const list = await loadBookmarks()
    setBookmarks(list)
  }, [])

  useEffect(() => {
    queueMicrotask(() => refreshBookmarks())
  }, [refreshBookmarks])

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

  const handleSaveBookmark = async () => {
    const name = bookmarkName.trim() || `Bookmark ${index + 1}`
    const snapshot = snapshots[index]
    if (!snapshot) return
    await saveBookmark(name, snapshot)
    setBookmarkName('')
    refreshBookmarks()
  }

  const handleLoadBookmark = (bookmark: Bookmark) => {
    setSimulationState({ ...bookmark.snapshot, isRunning: false })
    handleClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-4 max-h-[90vh] overflow-auto">
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

        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              placeholder="Bookmark name"
              className="flex-1 min-w-0 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200"
            />
            <button
              onClick={handleSaveBookmark}
              className="px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition"
            >
              Save Bookmark
            </button>
          </div>
          {bookmarks.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-auto">
              {bookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-2 py-1"
                >
                  <button
                    onClick={() => handleLoadBookmark(b)}
                    className="text-xs text-slate-700 dark:text-slate-300 truncate text-left flex-1"
                  >
                    {b.name}
                  </button>
                  <button
                    onClick={async () => {
                      await deleteBookmark(b.id)
                      refreshBookmarks()
                    }}
                    className="text-[10px] text-rose-600 hover:underline ml-2"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
