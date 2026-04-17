import { useEffect } from 'react'

interface Shortcuts {
  onTogglePlay: () => void
  onReset: () => void
  onAddTasks: (count: number) => void
  onUndo?: () => void
  onRedo?: () => void
  onOpenCommandPalette?: () => void
}

export function useKeyboardShortcuts({
  onTogglePlay,
  onReset,
  onAddTasks,
  onUndo,
  onRedo,
  onOpenCommandPalette,
}: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        // Allow Escape and Cmd+K even inside inputs
        if (!(e.key === 'Escape' || (e.metaKey && e.key.toLowerCase() === 'k'))) {
          return
        }
      }

      // Command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenCommandPalette?.()
        return
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          onRedo?.()
        } else {
          onUndo?.()
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        onRedo?.()
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
  }, [onTogglePlay, onReset, onAddTasks, onUndo, onRedo, onOpenCommandPalette])
}
