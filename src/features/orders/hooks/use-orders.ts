import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import { supabase } from '@/lib/supabase'
import {
  ORDERS_REALTIME_CHANNEL,
  ORDER_CREATED_EVENT,
  ORDER_UPDATED_EVENT,
  broadcastOrderCreated,
  broadcastOrderStatusUpdate,
  playAdminOrderChime,
  type OrderEventPayload,
} from '@/lib/orders-realtime'
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
  const queryClient = useQueryClient()
  const lastToastOrderRef = useRef<string | null>(null)

  useEffect(() => {
    const invalidateAdminOrders = () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.orders() })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer'] })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardSummary })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.receivablesSummary })
    }

    const handleNewOrderAlert = (orderId?: string, orderNumber?: string) => {
      invalidateAdminOrders()
      if (orderId && lastToastOrderRef.current !== orderId) {
        lastToastOrderRef.current = orderId
        playAdminOrderChime('new_order')
        const numStr = orderNumber ? ` #${orderNumber}` : ''
        toast.success(`🔔 New order placed${numStr}!`, {
          id: `new-order-${orderId}`,
          duration: 6000,
        })
      }
    }

    // 1. Local cross-tab sync
    let localChannel: BroadcastChannel | null = null
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        localChannel = new BroadcastChannel(ORDERS_REALTIME_CHANNEL)
        localChannel.onmessage = (event) => {
          const data = event.data as { type: string; payload?: OrderEventPayload }
          if (data?.type === ORDER_CREATED_EVENT) {
            handleNewOrderAlert(data.payload?.id, data.payload?.order_number)
          } else if (data?.type === ORDER_UPDATED_EVENT) {
            invalidateAdminOrders()
          }
        }
      }
    } catch {
      // BroadcastChannel fallback
    }

    // 2. Supabase Realtime Channel
    const channel = supabase.channel(ORDERS_REALTIME_CHANNEL, {
      config: {
        broadcast: { ack: false, self: true },
      },
    })

    // Listen to broadcast events from website & other admin tabs
    channel.on(
      'broadcast',
      { event: ORDER_CREATED_EVENT },
      ({ payload }: { payload: OrderEventPayload }) => {
        handleNewOrderAlert(payload?.id, payload?.order_number)
      },
    )

    channel.on('broadcast', { event: ORDER_UPDATED_EVENT }, () => {
      invalidateAdminOrders()
    })

    // Listen to database-level changes on orders table
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newRecord = payload.new as { id?: string; order_number?: string } | null
          handleNewOrderAlert(newRecord?.id, newRecord?.order_number)
        } else {
          invalidateAdminOrders()
        }
      },
    )

    channel.subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' && error) {
        console.warn('[AdminOrders] Supabase Realtime channel error:', error)
      }
    })

    return () => {
      try {
        localChannel?.close()
      } catch {
        // ignore
      }
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.orders(),
    queryFn: fetchOrders,
    // Automatic 15s background polling as a resilient fallback
    refetchInterval: 15000,
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: OrderStatus; reason?: string }) =>
      updateOrderStatus(id, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.orders() })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer'] })
      toast.success('Order updated')

      // Broadcast update instantly to user on website and other admin tabs
      broadcastOrderStatusUpdate({
        id: variables.id,
        status: variables.status,
        reason: variables.reason,
      })
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateOrderDeliveryCharge() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, deliveryCharge }: { id: string; deliveryCharge: number }) =>
      updateOrderDeliveryCharge(id, deliveryCharge),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.orders() })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer'] })
      toast.success('Delivery charge and order total updated')

      // Broadcast update instantly to user and admin tabs
      broadcastOrderStatusUpdate({
        id: variables.id,
        delivery_charge: variables.deliveryCharge,
      })
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

      // Broadcast new order creation to website and other admin tabs
      broadcastOrderCreated({
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        user_id: order.user_id,
      })
    },
    onError: (error: Error) => toast.error(`Failed to place order: ${error.message}`),
  })
}
