import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  createAdminOrder,
  fetchActiveDeliverySlots,
  fetchFoodItemsForOrder,
  fetchOrders,
  updateOrderDeliveryCharge,
  updateOrderStatus,
  type CreateAdminOrderInput,
} from '@/features/orders/services/orders-service'
import type { OrderStatus } from '@/types/database.types'

export function useOrders() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.orders(), queryFn: fetchOrders })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      updateOrderStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.orders() })
      toast.success('Order updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateOrderDeliveryCharge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, deliveryCharge }: { id: string; deliveryCharge: number }) =>
      updateOrderDeliveryCharge(id, deliveryCharge),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.orders() })
      toast.success('Delivery charge and order total updated')
    },
    onError: (error: Error) => toast.error(error.message),
  })
}

export function useActiveDeliverySlots() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.deliverySlots,
    queryFn: fetchActiveDeliverySlots,
  })
}

export function useFoodItemsForOrder() {
  return useQuery({
    queryKey: ['admin', 'food-items-for-order'],
    queryFn: fetchFoodItemsForOrder,
  })
}

export function useCreateAdminOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateAdminOrderInput) => createAdminOrder(input),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.orders() })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer'] })
      toast.success(`Order #${order.order_number} created successfully!`)
    },
    onError: (error: Error) => toast.error(`Failed to place order: ${error.message}`),
  })
}

