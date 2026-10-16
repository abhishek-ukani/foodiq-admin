import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  createFoodItem,
  deleteFoodItem,
  fetchFoodItems,
  updateFoodItem,
} from '@/features/food-items/services/food-items-service'
import { broadcastCatalogUpdate } from '@/lib/realtime-sync'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

export function useFoodItems() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.foodItems(), queryFn: fetchFoodItems })
}

export function useCreateFoodItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'food_items'>, 'branch_id'>) => createFoodItem(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('food_item_created')
      toast.success('Food item created')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateFoodItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'food_items'> }) =>
      updateFoodItem(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('food_item_updated')
      toast.success('Food item updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteFoodItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteFoodItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('food_item_deleted')
      toast.success('Food item deleted')
    },
    onError: (error) => toast.error(error.message),
  })
}
