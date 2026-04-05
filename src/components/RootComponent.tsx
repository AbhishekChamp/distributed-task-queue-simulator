import { Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useTheme } from '../hooks/useTheme'

const queryClient = new QueryClient()

export function RootComponent() {
  const { theme } = useTheme()
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster
        position="top-center"
        containerStyle={{
          top: 16,
          left: '50%',
          right: 'auto',
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
        toastOptions={{
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#1e293b',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            maxWidth: 320,
          },
        }}
      />
    </QueryClientProvider>
  )
}
