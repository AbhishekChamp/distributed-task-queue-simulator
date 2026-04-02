import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  override render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-6">
            <div className="max-w-md w-full rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 p-6">
              <h2 className="text-lg font-semibold text-rose-700 dark:text-rose-400 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-rose-600 dark:text-rose-300 mb-4">
                The simulation encountered an unexpected error. Please refresh the page to restart.
              </p>
              {this.state.error && (
                <pre className="text-xs bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded p-3 overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition"
              >
                Reload Application
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
