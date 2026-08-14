import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database.types'

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'thakar-rasoi-admin-auth',
  },
  global: {
    headers: { 'x-application-name': 'thakar-rasoi-admin' },
  },
})
