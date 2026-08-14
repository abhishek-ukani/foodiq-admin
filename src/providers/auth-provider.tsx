import { useEffect, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/features/auth/store/auth-store'
import type { Tables } from '@/types/database.types'

async function loadProfile(userId: string): Promise<Tables<'profiles'> | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
  if (error) {
    console.error('Failed to load profile', error)
    return null
  }
  return data
}

/**
 * Bootstraps the session and enforces the admin-only gate for this app: any
 * profile that isn't role='admin' is signed out immediately, so a customer or
 * delivery-boy credential can never hold a session here even momentarily.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession)
  const setProfile = useAuthStore((s) => s.setProfile)
  const setRejectedReason = useAuthStore((s) => s.setRejectedReason)
  const clear = useAuthStore((s) => s.clear)

  useEffect(() => {
    let isMounted = true

    async function applyAdminGate(userId: string): Promise<Tables<'profiles'> | null> {
      const profile = await loadProfile(userId)
      if (profile && profile.role !== 'admin') {
        await supabase.auth.signOut()
        setRejectedReason('This account does not have admin access.')
        return null
      }
      return profile
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return
      if (!session?.user) {
        setSession(null)
        return
      }
      const profile = await applyAdminGate(session.user.id)
      if (!isMounted) return
      if (profile) {
        setSession(session.user)
        setProfile(profile)
      } else {
        clear()
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      if (!session?.user) {
        clear()
        return
      }
      const profile = await applyAdminGate(session.user.id)
      if (!isMounted) return
      if (profile) {
        setSession(session.user)
        setProfile(profile)
      } else {
        clear()
      }
    })

    return () => {
      isMounted = false
      subscription.subscription.unsubscribe()
    }
  }, [setSession, setProfile, setRejectedReason, clear])

  return children
}
