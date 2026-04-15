import { Outlet } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionToaster } from './MotionToaster'

const queryClient = new QueryClient()

export function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <MotionToaster />
    </QueryClientProvider>
  )
}
