import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export async function fetchItemCustomizations(
  foodItemId: string,
): Promise<Tables<'item_customizations'>[]> {
  const { data, error } = await supabase
    .from('item_customizations')
    .select('*')
    .eq('food_item_id', foodItemId)
    .order('display_order')
  if (error) throw error
  return data
}

export async function createItemCustomization(
  input: TablesInsert<'item_customizations'>,
): Promise<Tables<'item_customizations'>> {
  const { data, error } = await supabase.from('item_customizations').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateItemCustomization(
  id: string,
  input: TablesUpdate<'item_customizations'>,
): Promise<Tables<'item_customizations'>> {
  const { data, error } = await supabase
    .from('item_customizations')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteItemCustomization(id: string): Promise<void> {
  const { error } = await supabase.from('item_customizations').delete().eq('id', id)
  if (error) throw error
}
