import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert } from '@/types/database.types'

export type ThaliComponentCategoryType =
  | 'bread'
  | 'sabji'
  | 'sweet'
  | 'snack'
  | 'accompaniment'
  | 'beverage'
  | 'rice'

export type ThaliComponentWithFood = Tables<'thali_components'> & {
  food_items: Tables<'food_items'> & { categories: Tables<'categories'> | null }
}

export const COMPONENT_CATEGORY_LABELS: Record<ThaliComponentCategoryType, string> = {
  bread: '🍞 Breads',
  sabji: '🍲 Sabjis',
  sweet: '🍨 Sweets',
  snack: '🍿 Snacks / Farsan',
  accompaniment: '🫙 Accompaniments',
  beverage: '🥤 Beverages',
  rice: '🍚 Rice & Dal / Khichdi',
}

const QUERY_KEY = ['thali-components'] as const

export async function fetchThaliComponents(): Promise<ThaliComponentWithFood[]> {
  const { data, error } = await supabase
    .from('thali_components')
    .select('*, food_items(*, categories(*))')
    .order('category_type')
    .order('display_order')
  if (error) throw error
  return data as unknown as ThaliComponentWithFood[]
}

export async function addThaliComponent(
  food_item_id: string,
  category_type: ThaliComponentCategoryType,
): Promise<Tables<'thali_components'>> {
  const { data, error } = await supabase
    .from('thali_components')
    .insert({ food_item_id, category_type, is_active: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleThaliComponent(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('thali_components')
    .update({ is_active })
    .eq('id', id)
  if (error) throw error
}

export async function removeThaliComponent(id: string): Promise<void> {
  const { error } = await supabase.from('thali_components').delete().eq('id', id)
  if (error) throw error
}

// ─── React Query Hooks ────────────────────────────────────────────────────────

export function useThaliComponents() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchThaliComponents,
  })
}

export function useAddThaliComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      food_item_id,
      category_type,
    }: {
      food_item_id: string
      category_type: ThaliComponentCategoryType
    }) => addThaliComponent(food_item_id, category_type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['admin', 'thali-option-groups'] })
      toast.success('Item added to global Thali components')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useToggleThaliComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleThaliComponent(id, is_active),
    onSuccess: (_, { is_active }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['admin', 'thali-option-groups'] })
      toast.success(is_active ? 'Item activated for all Thalis' : 'Item marked Out of Stock for all Thalis')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useRemoveThaliComponent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeThaliComponent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY })
      qc.invalidateQueries({ queryKey: ['admin', 'thali-option-groups'] })
      toast.success('Item removed from global Thali components')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
