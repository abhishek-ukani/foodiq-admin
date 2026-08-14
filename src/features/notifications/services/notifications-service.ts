import { supabase } from '@/lib/supabase'
import type { NotificationAudience, NotificationType, Tables, TablesInsert } from '@/types/database.types'

export async function fetchSentNotifications(): Promise<Tables<'notifications'>[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .neq('type', 'order_update')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

export interface BroadcastInput {
  audience: Extract<NotificationAudience, 'all' | 'customers'>
  type: NotificationType
  title: string
  body: string
  actionUrl?: string
  createdBy: string
}

/**
 * Fans out one notification row per target profile so every recipient gets
 * their own `is_read` — a single shared broadcast row can't be marked read
 * by one customer without affecting everyone else's inbox.
 */
export async function sendBroadcast(input: BroadcastInput): Promise<number> {
  let query = supabase.from('profiles').select('id').eq('is_active', true)
  if (input.audience === 'customers') {
    query = query.eq('role', 'customer')
  }
  const { data: targets, error: targetsError } = await query
  if (targetsError) throw targetsError
  if (!targets.length) return 0

  const rows: TablesInsert<'notifications'>[] = targets.map((profile) => ({
    user_id: profile.id,
    type: input.type,
    audience: input.audience,
    title: input.title,
    body: input.body,
    action_url: input.actionUrl || null,
    created_by: input.createdBy,
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) throw error
  return rows.length
}
