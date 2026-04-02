import { useEffect } from 'react'

interface Shortcuts {
  onTogglePlay: () => void
  onReset: () => void
  onAddTasks: (count: number) => void
}

export function useKeyboardShortcuts({ onTogglePlay, onReset, onAddTasks }: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }

      switch (e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault()
          onTogglePlay()
          break
        case 'r':
        case 'R':
          onReset()
          break
        case '1':
          onAddTasks(1)
          break
        case '2':
          onAddTasks(10)
          break
        case '3':
          onAddTasks(100)
          break
        case '4':
          onAddTasks(1000)
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onTogglePlay, onReset, onAddTasks])
}
