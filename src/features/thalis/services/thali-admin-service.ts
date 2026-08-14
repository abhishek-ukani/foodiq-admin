import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { ADMIN_QUERY_KEYS } from '@/constants'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type ThaliOptionGroupWithItems = Tables<'thali_option_groups'> & {
  thali_option_items: Tables<'thali_option_items'>[]
}

export async function fetchThaliOptionGroupsWithItems(
  foodItemId?: string,
): Promise<ThaliOptionGroupWithItems[]> {
  let query = supabase
    .from('thali_option_groups')
    .select('*, target_category:target_category_id(id, name), thali_option_items(*, food_items:linked_food_item_id(id, name))')
    .order('display_order', { ascending: true })

  if (foodItemId) {
    query = query.eq('food_item_id', foodItemId)
  }

  const { data, error } = await query
  if (error) throw error

  // Sort child items by display_order
  return ((data as any[]) || []).map((grp) => ({
    ...grp,
    thali_option_items: ((grp.thali_option_items as Tables<'thali_option_items'>[]) || []).sort(
      (a: Tables<'thali_option_items'>, b: Tables<'thali_option_items'>) =>
        a.display_order - b.display_order,
    ),
  })) as ThaliOptionGroupWithItems[]
}

export async function createThaliOptionGroup(
  input: TablesInsert<'thali_option_groups'>,
): Promise<Tables<'thali_option_groups'>> {
  const { data, error } = await supabase
    .from('thali_option_groups')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateThaliOptionGroup(
  id: string,
  input: TablesUpdate<'thali_option_groups'>,
): Promise<Tables<'thali_option_groups'>> {
  const { data, error } = await supabase
    .from('thali_option_groups')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteThaliOptionGroup(id: string): Promise<void> {
  const { error } = await supabase.from('thali_option_groups').delete().eq('id', id)
  if (error) throw error
}

export async function createThaliOptionItem(
  input: TablesInsert<'thali_option_items'>,
): Promise<Tables<'thali_option_items'>> {
  const { data, error } = await supabase
    .from('thali_option_items')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateThaliOptionItem(
  id: string,
  input: TablesUpdate<'thali_option_items'>,
): Promise<Tables<'thali_option_items'>> {
  const { data, error } = await supabase
    .from('thali_option_items')
    .update(input)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteThaliOptionItem(id: string): Promise<void> {
  const { error } = await supabase.from('thali_option_items').delete().eq('id', id)
  if (error) throw error
}

// React Query Hooks

export function useThaliOptionGroups(foodItemId?: string) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(foodItemId),
    queryFn: () => fetchThaliOptionGroupsWithItems(foodItemId),
  })
}

export function useCreateThaliOptionGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesInsert<'thali_option_groups'>) => createThaliOptionGroup(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(variables.food_item_id),
      })
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(),
      })
      toast.success('Option group created successfully')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateThaliOptionGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'thali_option_groups'> }) =>
      updateThaliOptionGroup(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(),
      })
      toast.success('Option group updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteThaliOptionGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteThaliOptionGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(),
      })
      toast.success('Option group deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useCreateThaliOptionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesInsert<'thali_option_items'>) => createThaliOptionItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(),
      })
      toast.success('Option item added')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateThaliOptionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'thali_option_items'> }) =>
      updateThaliOptionItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(),
      })
      toast.success('Option item updated')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteThaliOptionItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteThaliOptionItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.thaliOptionGroups(),
      })
      toast.success('Option item deleted')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
