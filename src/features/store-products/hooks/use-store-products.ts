import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  addFoodItemToStore,
  deleteStoreProduct,
  fetchStoreProducts,
  fetchUnplacedFoodItems,
  placeItemInStoreCategory,
  toggleProductAvailability,
  updateProductPrice,
  updateStoreProduct,
  type AddFoodItemToStoreInput,
} from '../services/store-products-service'
import { broadcastCatalogUpdate } from '@/lib/realtime-sync'
import type { TablesUpdate } from '@/types/database.types'

export function useStoreProducts() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.storeProducts,
    queryFn: fetchStoreProducts,
  })
}

export function useUnplacedFoodItems() {
  return useQuery({
    queryKey: ['admin', 'unplaced-food-items'],
    queryFn: fetchUnplacedFoodItems,
  })
}

export function useToggleProductAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_available }: { id: string; is_available: boolean }) =>
      toggleProductAvailability(id, is_available),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.storeProducts })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('store_product_availability_toggled')
      toast.success(variables.is_available ? 'Product enabled for sale' : 'Product disabled')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateProductPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      price,
      compare_price,
    }: {
      id: string
      price: number
      compare_price: number | null
    }) => updateProductPrice(id, price, compare_price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.storeProducts })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('store_product_price_updated')
      toast.success('Price updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function usePlaceItemInStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      foodItemId,
      targetCategoryId,
    }: {
      foodItemId: string
      targetCategoryId: string
    }) => placeItemInStoreCategory(foodItemId, targetCategoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.storeProducts })
      queryClient.invalidateQueries({ queryKey: ['admin', 'unplaced-food-items'] })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('store_product_placed')
      toast.success('Product placed into store for direct sale')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useAddFoodItemToStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddFoodItemToStoreInput) => addFoodItemToStore(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.storeProducts })
      queryClient.invalidateQueries({ queryKey: ['admin', 'unplaced-food-items'] })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('store_product_added')
      toast.success('Food item added to store offerings')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateStoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'food_items'> }) =>
      updateStoreProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.storeProducts })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('store_product_updated')
      toast.success('Product updated successfully')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteStoreProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteStoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.storeProducts })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.foodItems() })
      broadcastCatalogUpdate('store_product_deleted')
      toast.success('Product removed from store')
    },
    onError: (error) => toast.error(error.message),
  })
}
