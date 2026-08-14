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
  const { data, error } = await supabase
    .from('food_items')
    .insert({ ...input, branch_id })
    .select()
    .single()
  if (error) throw error
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
  if (error) throw error
  return data
}

export async function deleteFoodItem(id: string): Promise<void> {
  const { error } = await supabase.from('food_items').delete().eq('id', id)
  if (error) throw error
}
