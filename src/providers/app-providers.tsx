import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from 'react-hot-toast'
import { TooltipProvider } from '@/components/ui/tooltip'
import { queryClient } from '@/lib/query-client'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { ErrorBoundary } from '@/components/common/error-boundary'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster
                position="top-center"
                toastOptions={{
                  className:
                    '!bg-card !text-card-foreground !border !border-border !shadow-lg !rounded-xl',
                  duration: 4000,
                }}
              />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
