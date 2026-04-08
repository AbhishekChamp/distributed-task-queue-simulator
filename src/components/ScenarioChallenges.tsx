import { challenges } from '../hooks/useChallenges'
import type { ChallengeProgress } from '../hooks/useChallenges'

export type { ChallengeProgress }

export function ChallengesButton({
  completedCount,
  onClick,
}: {
  completedCount: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Scenario challenges"
      title="Scenario challenges"
      className="relative px-2 py-1.5 rounded-md bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-600/30 transition text-sm"
    >
      <span>🏆</span>
      {completedCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
          {completedCount}
        </span>
      )}
    </button>
  )
}

export function ChallengesPanel({
  progress,
  onClose,
  onReset,
}: {
  progress: ChallengeProgress
  onClose: () => void
  onReset: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-xl max-h-[80vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Scenario Challenges
          </h3>
          <button
            onClick={onClose}
            aria-label="Close challenges"
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {challenges.map((ch) => {
            const unlocked = progress[ch.id]
            return (
              <div
                key={ch.id}
                className={`rounded-lg border p-3 transition ${
                  unlocked
                    ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {ch.title}
                  </h4>
                  <span
                    className={`text-xs font-medium ${
                      unlocked
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {unlocked ? 'Completed' : 'Locked'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{ch.description}</p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Objective:</span> {ch.objective}
                </p>
              </div>
            )
          })}
        </div>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {Object.values(progress).filter(Boolean).length} / {challenges.length} completed
          </span>
          <button
            onClick={onReset}
            className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  )
}
