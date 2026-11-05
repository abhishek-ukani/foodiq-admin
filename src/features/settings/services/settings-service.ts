import { supabase } from '@/lib/supabase'
import type { Json, Tables } from '@/types/database.types'

export async function fetchSystemConfig(): Promise<Tables<'system_config'>[]> {
  const { data, error } = await supabase.from('system_config').select('*')
  if (error) throw error
  return data
}

export async function updateSystemConfigKey(key: string, value: Json): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('system_config')
    .upsert(
      {
        key,
        value,
        is_public: true,
        updated_by: session.user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' },
    )
  if (error) throw error
}
