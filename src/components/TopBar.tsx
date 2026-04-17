import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Play, Pause, RotateCcw, Plus, Menu, Search, Undo, Redo, BookOpen } from './icons'
import { ThemeToggle } from './ThemeToggle'

interface TopBarProps {
  isRunning: boolean
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onAddTasks: (count: number) => void
  onToggleFullscreen?: () => void
  isFullscreen?: boolean
  onCopyUrl?: () => void
  onRestartTour?: () => void
  challengeButton?: ReactNode
  onToggleSidebar?: () => void
  onOpenCommandPalette?: () => void
  onOpenGlossary?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
}

export function TopBar({
  isRunning,
  onStart,
  onPause,
  onReset,
  onAddTasks,
  onToggleFullscreen,
  isFullscreen,
  onCopyUrl,
  onRestartTour,
  challengeButton,
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenGlossary,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: TopBarProps) {
  return (
    <header
      role="banner"
      className="h-14 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-between px-4 shrink-0"
    >
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="lg:hidden p-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" aria-hidden="true" />
        <h1 className="text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 truncate">
          DTQ Simulator
        </h1>
      </div>

      <nav aria-label="Simulation controls" className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onPause}
            aria-label="Pause simulation"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-600/30 transition"
          >
            <Pause className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Pause</span>
          </button>
        ) : (
          <button
            onClick={onStart}
            aria-label="Start simulation"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-100 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-600/30 transition"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">Start</span>
          </button>
        )}

        <button
          onClick={onReset}
          aria-label="Reset simulation"
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          <span className="text-sm">Reset</span>
        </button>

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" aria-hidden="true" />

        {[1, 10, 100, 1000].map((count) => (
          <button
            key={count}
            onClick={() => onAddTasks(count)}
            aria-label={`Add ${count} tasks`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-600/30 transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm">{count}</span>
          </button>
        ))}

        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1" aria-hidden="true" />

        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo config change"
            title="Undo"
            className={`p-1.5 rounded-md transition ${
              canUndo
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo className="w-4 h-4" />
          </button>
        )}

        {onRedo && (
          <button
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo config change"
            title="Redo"
            className={`p-1.5 rounded-md transition ${
              canRedo
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo className="w-4 h-4" />
          </button>
        )}

        {challengeButton}

        {onOpenCommandPalette && (
          <button
            onClick={onOpenCommandPalette}
            aria-label="Open command palette"
            title="Command Palette (Cmd+K)"
            className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            <Search className="w-4 h-4" />
          </button>
        )}

        {onOpenGlossary && (
          <button
            onClick={onOpenGlossary}
            aria-label="Open glossary"
            title="Glossary"
            className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        )}

        {onRestartTour && (
          <button
            onClick={onRestartTour}
            aria-label="Restart guided tour"
            title="Restart guided tour"
            className="px-2 py-1.5 rounded-md bg-sky-100 dark:bg-sky-600/20 text-sky-700 dark:text-sky-400 hover:bg-sky-200 dark:hover:bg-sky-600/30 transition text-sm"
          >
            ?
          </button>
        )}

        {onCopyUrl && (
          <button
            onClick={onCopyUrl}
            aria-label="Copy shareable URL"
            className="px-3 py-1.5 rounded-md bg-violet-100 dark:bg-violet-600/20 text-violet-700 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-600/30 transition text-sm"
          >
            Share
          </button>
        )}

        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            aria-pressed={isFullscreen}
            className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm"
          >
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        )}

        <Link
          to="/compare"
          className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm"
        >
          Compare
        </Link>

        <Link
          to="/about"
          className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition text-sm"
        >
          About
        </Link>

        <ThemeToggle />
      </nav>
    </header>
  )
}
