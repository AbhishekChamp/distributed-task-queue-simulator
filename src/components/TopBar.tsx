import { Play, Pause, RotateCcw, Plus } from './icons'

interface TopBarProps {
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onAddTasks: (count: number) => void
}

export function TopBar({ isRunning, onStart, onPause, onReset, onAddTasks }: TopBarProps) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
        <h1 className="text-sm font-semibold tracking-wide text-slate-100">
          Distributed Task Queue Simulator
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 transition"
          >
            <Pause className="w-4 h-4" />
            <span className="text-sm">Pause</span>
          </button>
        ) : (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition"
          >
            <Play className="w-4 h-4" />
            <span className="text-sm">Start</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="text-sm">Reset</span>
        </button>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {[1, 10, 100, 1000].map((count) => (
          <button
            key={count}
            onClick={() => onAddTasks(count)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600/20 text-sky-400 hover:bg-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">{count}</span>
          </button>
        ))}
      </div>
    </header>
  )
}
