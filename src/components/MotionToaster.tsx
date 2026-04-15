import { useToaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'

export function MotionToaster() {
  const { toasts, handlers } = useToaster()
  const { startPause, endPause, updateHeight } = handlers

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-80 flex flex-col-reverse gap-2 pointer-events-none"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      <AnimatePresence mode="popLayout">
        {toasts
          .filter((t) => t.visible)
          .map((toast) => {
            const isError = toast.type === 'error'
            const isSuccess = toast.type === 'success'
            const bg = isError
              ? 'bg-rose-50 dark:bg-rose-950/30'
              : isSuccess
                ? 'bg-emerald-50 dark:bg-emerald-950/30'
                : 'bg-white dark:bg-slate-900'
            const border = isError
              ? 'border-rose-200 dark:border-rose-900/50'
              : isSuccess
                ? 'border-emerald-200 dark:border-emerald-900/50'
                : 'border-slate-200 dark:border-slate-700'
            const text = 'text-slate-800 dark:text-slate-100'

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="pointer-events-auto w-full"
                onMouseEnter={startPause}
                onMouseLeave={endPause}
              >
                <div
                  ref={(el) => {
                    if (el) updateHeight(toast.id, el.getBoundingClientRect().height)
                  }}
                  className={`rounded-lg border ${border} ${bg} ${text} text-sm shadow-lg px-3.5 py-2.5 max-w-xs`}
                >
                  {toast.message as React.ReactNode}
                </div>
              </motion.div>
            )
          })}
      </AnimatePresence>
    </div>
  )
}
