import { supabase } from '@/lib/supabase'

let cachedBranchId: string | null = null

/**
 * Resolves the default branch id. Cached in memory for the session — we're
 * single-branch today, and this is read constantly (every create/insert
 * across menu, orders, and delivery config needs it).
 */
export async function getDefaultBranchId(): Promise<string> {
  if (cachedBranchId) return cachedBranchId

  const { data, error } = await supabase
    .from('branches')
    .select('id')
    .eq('is_default', true)
    .single()
  if (error) throw error

  cachedBranchId = data.id
  return data.id
}
