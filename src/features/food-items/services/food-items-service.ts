import { supabase } from '@/lib/supabase'
import { getDefaultBranchId } from '@/lib/default-branch'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type FoodItemWithCategory = Tables<'food_items'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name' | 'category_type'> | null
}

export async function fetchFoodItems(): Promise<FoodItemWithCategory[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(id, name, category_type)')
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
    // If the database does not have the product_code column, retry without it
    if (error.message?.includes('product_code') || (error as any).code === 'PGRST204') {
      const { product_code: _code, ...cleanPayload } = payload as any
      const retry = await supabase
        .from('food_items')
        .insert(cleanPayload)
        .select()
        .single()
      if (retry.error) throw retry.error
      return retry.data
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
    // If the database does not have the product_code column, retry without it
    if (error.message?.includes('product_code') || (error as any).code === 'PGRST204') {
      const { product_code: _code, ...cleanInput } = input as any
      const retry = await supabase
        .from('food_items')
        .update(cleanInput)
        .eq('id', id)
        .select()
        .single()
      if (retry.error) throw retry.error
      return retry.data
    }
    throw error
  }
  return data
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', id)
  if (error) throw error
}
