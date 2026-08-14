import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Tables } from '@/types/database.types'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: User | null
  profile: Tables<'profiles'> | null
  /** Set when a non-admin signed in successfully but was rejected by this app. */
  rejectedReason: string | null
  setSession: (user: User | null) => void
  setProfile: (profile: Tables<'profiles'> | null) => void
  setRejectedReason: (reason: string | null) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  profile: null,
  rejectedReason: null,
  setSession: (user) => set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
  setProfile: (profile) => set({ profile }),
  setRejectedReason: (reason) => set({ rejectedReason: reason }),
  clear: () => set({ status: 'unauthenticated', user: null, profile: null }),
}))
