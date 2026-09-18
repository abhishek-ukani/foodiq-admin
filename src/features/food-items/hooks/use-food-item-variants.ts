import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  createFoodItemVariant,
  deleteFoodItemVariant,
  fetchAllFoodItemVariants,
  fetchFoodItemVariants,
  toggleVariantActive,
  updateFoodItemVariant,
  type CreateFoodItemVariantInput,
} from '../services/food-item-variants-service'
import { broadcastCatalogUpdate } from '@/lib/realtime-sync'
import type { TablesUpdate } from '@/types/database.types'

export const VARIANTS_KEY = (foodItemId: string) =>
  ['admin', 'food-item-variants', foodItemId] as const

export const ALL_VARIANTS_KEY = ['admin', 'food-item-variants', 'all'] as const

export function useFoodItemVariants(foodItemId: string | undefined) {
  return useQuery({
    queryKey: VARIANTS_KEY(foodItemId ?? ''),
    queryFn: () => fetchFoodItemVariants(foodItemId!),
    enabled: Boolean(foodItemId),
  })
}

export function useAllFoodItemVariants() {
  return useQuery({
    queryKey: ALL_VARIANTS_KEY,
    queryFn: () => fetchAllFoodItemVariants(),
  })
}

export function useCreateFoodItemVariant(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<CreateFoodItemVariantInput, 'food_item_id'>) =>
      createFoodItemVariant({ ...input, food_item_id: foodItemId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY(foodItemId) })
      queryClient.invalidateQueries({ queryKey: ALL_VARIANTS_KEY })
      broadcastCatalogUpdate('food_item_variant_created')
      toast.success('Variant added successfully')
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to add variant'),
  })
}

export function useUpdateFoodItemVariant(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: TablesUpdate<'food_item_variants'>
    }) => updateFoodItemVariant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY(foodItemId) })
      queryClient.invalidateQueries({ queryKey: ALL_VARIANTS_KEY })
      broadcastCatalogUpdate('food_item_variant_updated')
      toast.success('Variant updated')
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update variant'),
  })
}

export function useToggleVariantActive(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleVariantActive(id, isActive),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY(foodItemId) })
      queryClient.invalidateQueries({ queryKey: ALL_VARIANTS_KEY })
      broadcastCatalogUpdate('food_item_variant_toggled')
      toast.success(
        updated.is_active
          ? `Variant "${updated.label}" enabled for sale`
          : `Variant "${updated.label}" disabled`,
      )
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to toggle variant status'),
  })
}

export function useDeleteFoodItemVariant(foodItemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFoodItemVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VARIANTS_KEY(foodItemId) })
      queryClient.invalidateQueries({ queryKey: ALL_VARIANTS_KEY })
      broadcastCatalogUpdate('food_item_variant_deleted')
      toast.success('Variant deleted')
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete variant'),
  })
}
