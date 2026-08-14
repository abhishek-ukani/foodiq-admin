import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { ADMIN_ROUTES } from '@/constants'
import { PageLoader } from '@/components/common/page-loader'

/**
 * Redirects to login when signed out. Admin-role enforcement itself happens in
 * AuthProvider (a non-admin session never reaches 'authenticated' here), so
 * this only needs to gate on being signed in at all.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth()
  const location = useLocation()

  if (isLoading) return <PageLoader />

  if (!isAuthenticated) {
    return <Navigate to={ADMIN_ROUTES.login} state={{ from: location }} replace />
  }

  return children
}
