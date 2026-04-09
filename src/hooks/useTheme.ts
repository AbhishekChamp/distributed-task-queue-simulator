import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system' | 'contrast'

const STORAGE_KEY = 'dtq-theme'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system'
  })

  const setTheme = (next: Theme) => {
    setThemeState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next)
    }
  }

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      root.classList.remove('contrast')
      if (theme === 'system') {
        root.classList.toggle('dark', systemDark.matches)
      } else if (theme === 'contrast') {
        root.classList.add('dark', 'contrast')
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    apply()

    if (theme === 'system') {
      const listener = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches)
      }
      systemDark.addEventListener('change', listener)
      return () => systemDark.removeEventListener('change', listener)
    }
  }, [theme])

  return { theme, setTheme }
}
