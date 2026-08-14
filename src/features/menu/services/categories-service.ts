import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export async function fetchCategories(): Promise<Tables<'categories'>[]> {
  const { data, error } = await supabase.from('categories').select('*').order('display_order')
  if (error) throw error
  return data
}

export async function createCategory(input: TablesInsert<'categories'>): Promise<Tables<'categories'>> {
  const { data, error } = await supabase.from('categories').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  input: TablesUpdate<'categories'>,
): Promise<Tables<'categories'>> {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}
