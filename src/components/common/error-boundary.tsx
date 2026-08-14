import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack)
  }

  private reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div
        role="alert"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <div className="bg-destructive/10 text-destructive flex size-16 items-center justify-center rounded-full">
          <TriangleAlert className="size-8" aria-hidden />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            An unexpected error stopped this page from loading. Try again, and if it keeps
            happening, please get in touch.
          </p>
        </div>
        <Button onClick={this.reset}>
          <RefreshCw className="size-4" aria-hidden />
          Try again
        </Button>
      </div>
    )
  }
}
