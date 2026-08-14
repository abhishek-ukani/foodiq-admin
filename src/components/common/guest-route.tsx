import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ADMIN_ROUTES } from '@/constants'
import { PageLoader } from '@/components/common/page-loader'

/** Keeps a signed-in admin off the login/forgot-password pages. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from

  if (isLoading) return <PageLoader />

  if (isAuthenticated) {
    return <Navigate to={from?.pathname ?? ADMIN_ROUTES.dashboard} replace />
  }

  return children
}
