import { useAuthStore } from '@/features/auth/store/auth-store'

export function useAuth() {
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const rejectedReason = useAuthStore((s) => s.rejectedReason)
  const setRejectedReason = useAuthStore((s) => s.setRejectedReason)

  return {
    status,
    user,
    profile,
    rejectedReason,
    clearRejectedReason: () => setRejectedReason(null),
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isAdmin: profile?.role === 'admin',
  }
}
