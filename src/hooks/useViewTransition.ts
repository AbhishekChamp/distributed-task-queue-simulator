import { useCallback } from 'react'

export function useViewTransition() {
  const withTransition = useCallback(<T>(fn: () => T): T => {
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
    if (typeof doc.startViewTransition === 'function') {
      let result: T
      doc.startViewTransition(() => {
        result = fn()
      })
      return result!
    }
    return fn()
  }, [])

  return withTransition
}
