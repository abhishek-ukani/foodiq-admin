import type { AuthError } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { env } from '@/lib/env'

/**
 * Supabase's raw error messages are written for developers, not the admins
 * using this dashboard. Map the ones they actually hit to something actionable.
 */
export function toFriendlyAuthMessage(error: AuthError | Error | unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (/Invalid login credentials/i.test(message)) {
    return 'Incorrect email or password. Please try again.'
  }
  if (/rate limit/i.test(message)) {
    return 'Too many attempts. Please wait a minute and try again.'
  }
  if (/network/i.test(message)) {
    return 'Network error. Check your connection and try again.'
  }
  return message || 'Something went wrong. Please try again.'
}

export async function signInWithEmail(input: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword(input)
  if (error) throw error
  return data
}

export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || `${env.appUrl}/login`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function sendPasswordResetEmail(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/reset-password`,
  })
  if (error) throw error
}

/** Called on the reset-password page, after Supabase establishes a recovery session from the email link. */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}
