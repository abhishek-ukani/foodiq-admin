import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  createDeliveryArea,
  createDeliveryFeeRule,
  createDeliverySlot,
  createDeliveryZone,
  deleteDeliveryArea,
  deleteDeliveryFeeRule,
  deleteDeliverySlot,
  deleteDeliveryZone,
  fetchDeliveryAreas,
  fetchDeliveryFeeRules,
  fetchDeliverySlots,
  fetchDeliveryZones,
  updateDeliveryArea,
  updateDeliveryFeeRule,
  updateDeliverySlot,
  updateDeliveryZone,
} from '@/features/settings/services/delivery-service'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Delivery Areas (Legacy)
// ---------------------------------------------------------------------------

export function useDeliveryAreas() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.deliveryAreas, queryFn: fetchDeliveryAreas })
}

export function useCreateDeliveryArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'delivery_areas'>, 'branch_id'>) => createDeliveryArea(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryAreas })
      toast.success('Delivery area added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateDeliveryArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'delivery_areas'> }) =>
      updateDeliveryArea(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryAreas })
      toast.success('Delivery area updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDeliveryArea() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDeliveryArea(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryAreas })
      toast.success('Delivery area removed')
    },
    onError: (error) => toast.error(error.message),
  })
}

// ---------------------------------------------------------------------------
// Delivery Zones (Pre-classified Localities: FREE, PAID, BLOCKED)
// ---------------------------------------------------------------------------

export function useDeliveryZones() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.deliveryZones, queryFn: fetchDeliveryZones })
}

export function useCreateDeliveryZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesInsert<'delivery_zones'>) => createDeliveryZone(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryZones })
      toast.success('Delivery zone added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateDeliveryZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TablesUpdate<'delivery_zones'> }) =>
      updateDeliveryZone(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryZones })
      toast.success('Delivery zone updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDeliveryZone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDeliveryZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryZones })
      toast.success('Delivery zone removed')
    },
    onError: (error) => toast.error(error.message),
  })
}

// ---------------------------------------------------------------------------
// Delivery Fee Rules (Distance Tiers)
// ---------------------------------------------------------------------------

export function useDeliveryFeeRules() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.deliveryFeeRules, queryFn: fetchDeliveryFeeRules })
}

export function useCreateDeliveryFeeRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesInsert<'delivery_fee_rules'>) => createDeliveryFeeRule(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryFeeRules })
      toast.success('Distance fee rule added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateDeliveryFeeRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TablesUpdate<'delivery_fee_rules'> }) =>
      updateDeliveryFeeRule(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryFeeRules })
      toast.success('Distance fee rule updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDeliveryFeeRule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteDeliveryFeeRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliveryFeeRules })
      toast.success('Distance fee rule removed')
    },
    onError: (error) => toast.error(error.message),
  })
}

// ---------------------------------------------------------------------------
// Delivery Slots
// ---------------------------------------------------------------------------

export function useDeliverySlots() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.deliverySlots, queryFn: fetchDeliverySlots })
}

export function useCreateDeliverySlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: Omit<TablesInsert<'delivery_slots'>, 'branch_id'>) => createDeliverySlot(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliverySlots })
      toast.success('Delivery slot added')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useUpdateDeliverySlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'delivery_slots'> }) =>
      updateDeliverySlot(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliverySlots })
      toast.success('Delivery slot updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useDeleteDeliverySlot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDeliverySlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.deliverySlots })
      toast.success('Delivery slot removed')
    },
    onError: (error) => toast.error(error.message),
  })
}
