import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    return (localStorage.getItem('theme') as Theme) || 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      if (theme === 'system') {
        root.classList.toggle('dark', systemDark.matches)
      } else {
        root.classList.toggle('dark', theme === 'dark')
      }
    }

    apply()
    localStorage.setItem('theme', theme)

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
