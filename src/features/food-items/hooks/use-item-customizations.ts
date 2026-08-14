import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  createItemCustomization,
  deleteItemCustomization,
  fetchItemCustomizations,
  updateItemCustomization,
} from '@/features/food-items/services/item-customizations-service'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

const KEY = (foodItemId: string) => ['admin', 'item-customizations', foodItemId] as const

export function useItemCustomizations(foodItemId: string | undefined) {
  return useQuery({
    queryKey: KEY(foodItemId ?? ''),
    queryFn: () => fetchItemCustomizations(foodItemId!),
    enabled: Boolean(foodItemId),
  })
}

export function useCreateItemCustomization(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'item_customizations'>, 'food_item_id'>) =>
      createItemCustomization({ ...input, food_item_id: foodItemId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(foodItemId) }),
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateItemCustomization(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'item_customizations'> }) =>
      updateItemCustomization(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(foodItemId) }),
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteItemCustomization(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteItemCustomization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY(foodItemId) }),
    onError: (error) => toast.error(error.message),
  })
}
