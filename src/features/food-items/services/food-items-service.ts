import { supabase } from '@/lib/supabase'
import { getDefaultBranchId } from '@/lib/default-branch'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type FoodItemWithCategory = Tables<'food_items'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name'> | null
}

export async function fetchFoodItems(): Promise<FoodItemWithCategory[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as FoodItemWithCategory[]
}

export async function createFoodItem(
  input: Omit<TablesInsert<'food_items'>, 'branch_id'>,
): Promise<Tables<'food_items'>> {
  const branch_id = await getDefaultBranchId()
  const payload = { ...input, branch_id }
  const { data, error } = await supabase
    .from('food_items')
    .insert(payload)
    .select()
    .single()
  if (error) {
    if (error.message?.includes('product_code') || (error as any).details?.includes('product_code')) {
      const fallbackPayload = { ...payload }
      delete (fallbackPayload as any).product_code
      const fallback = await supabase
        .from('food_items')
        .insert(fallbackPayload)
        .select()
        .single()
      if (fallback.error) throw fallback.error
      console.warn(
        'Saved food item without product_code. Run migration 20261002_01_product_variants_and_order_tracking.sql in Supabase to enable product codes.',
      )
      return fallback.data
    }
    throw error
  }
  return data
}

export async function updateFoodItem(
  id: string,
  input: TablesUpdate<'food_items'>,
): Promise<Tables<'food_items'>> {
  const { data, error } = await supabase
    .from('food_items')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) {
    if (error.message?.includes('product_code') || (error as any).details?.includes('product_code')) {
      const fallbackPayload = { ...input }
      delete (fallbackPayload as any).product_code
      const fallback = await supabase
        .from('food_items')
        .update(fallbackPayload)
        .eq('id', id)
        .select()
        .single()
      if (fallback.error) throw fallback.error
      console.warn(
        'Updated food item without product_code. Run migration 20261002_01_product_variants_and_order_tracking.sql in Supabase to enable product codes.',
      )
      return fallback.data
    }
    throw error
  }
  return data
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', id)
  if (error) throw error
}
