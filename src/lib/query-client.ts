import { QueryClient } from '@tanstack/react-query'

/**
 * A `PostgrestError` (missing table, RLS denial, bad filter, constraint
 * violation…) has no HTTP status on the thrown object — only `code` /
 * `message` / `details` / `hint`. It means the server actually responded, so
 * retrying changes nothing. Only genuine network failures (offline, DNS,
 * timeout) are worth a retry, and those come through as a plain Error/TypeError
 * with no `code` string.
 */
function isRetryableError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code !== 'string'
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
