import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as subService from '../services/subscriptions-service'
import type { TablesInsert, TablesUpdate } from '@/types/database.types'

export const SUB_QUERY_KEYS = {
  variants: ['subscription-variants'] as const,
  settings: ['subscription-settings'] as const,
  closedDates: ['subscription-closed-dates'] as const,
  subscriptions: (status?: string, search?: string) =>
    ['subscriptions-list', status, search] as const,
  ledger: (id: string) => ['subscription-ledger', id] as const,
  prepList: (date: string) => ['subscription-prep-list', date] as const,
  enquiries: (status?: string) => ['subscription-enquiries', status] as const,
  auditLogs: ['subscription-audit-logs'] as const,
  foodItems: ['food-items-selection'] as const,
}

// ---------------------------------------------------------------------------
// Plan Variants
// ---------------------------------------------------------------------------
export function usePlanVariants() {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.variants,
    queryFn: subService.fetchPlanVariants,
  })
}

export function useCreatePlanVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesInsert<'plan_variants'>) => subService.createPlanVariant(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.variants })
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.auditLogs })
      toast.success('Plan variant created successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create plan variant')
    },
  })
}

export function useUpdatePlanVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TablesUpdate<'plan_variants'> }) =>
      subService.updatePlanVariant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.variants })
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.auditLogs })
      toast.success('Plan variant updated (applies to new subscriptions only)')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update plan variant')
    },
  })
}

export function useDeletePlanVariant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => subService.deletePlanVariant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.variants })
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.auditLogs })
      toast.success('Plan variant deleted')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete plan variant')
    },
  })
}

// ---------------------------------------------------------------------------
// Global Settings
// ---------------------------------------------------------------------------
export function useSubscriptionSettings() {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.settings,
    queryFn: subService.fetchSubscriptionSettings,
  })
}

export function useUpdateSubscriptionSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TablesUpdate<'subscription_settings'>) =>
      subService.updateSubscriptionSettings(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.settings })
      queryClient.invalidateQueries({ queryKey: SUB_QUERY_KEYS.auditLogs })
      toast.success('Subscription settings updated successfully')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings')
    },
  })
}


// ---------------------------------------------------------------------------
// Subscriptions List & Details
// ---------------------------------------------------------------------------
export function useSubscriptions(statusFilter?: string, search?: string) {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.subscriptions(statusFilter, search),
    queryFn: () => subService.fetchSubscriptions(statusFilter, search),
  })
}

export function useSubscriptionLedger(subscriptionId: string | null) {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.ledger(subscriptionId || ''),
    queryFn: () => subService.fetchSubscriptionLedger(subscriptionId!),
    enabled: Boolean(subscriptionId),
  })
}

export function useConfirmSubscriptionPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string | null }) =>
      subService.confirmSubscriptionPayment(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions-list'] })
      toast.success('Payment confirmed! Subscription is now active.')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to confirm payment')
    },
  })
}

// ---------------------------------------------------------------------------
// Tomorrow's Prep & Orders
// ---------------------------------------------------------------------------
export function useTomorrowPrep(dateStr: string) {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.prepList(dateStr),
    queryFn: () => subService.fetchTomorrowPrepList(dateStr),
    enabled: Boolean(dateStr),
  })
}


// ---------------------------------------------------------------------------
// Enquiries
// ---------------------------------------------------------------------------
export function usePlanEnquiries(statusFilter?: string) {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.enquiries(statusFilter),
    queryFn: () => subService.fetchPlanEnquiries(statusFilter),
  })
}

export function useUpdatePlanEnquiryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string
      status: 'new' | 'in_progress' | 'resolved' | 'closed'
      notes?: string | null
    }) => subService.updatePlanEnquiryStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-enquiries'] })
      toast.success('Enquiry updated')
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update enquiry')
    },
  })
}

// ---------------------------------------------------------------------------
// Audit Logs & Food Items
// ---------------------------------------------------------------------------
export function useSubscriptionAuditLogs() {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.auditLogs,
    queryFn: subService.fetchSubscriptionAuditLogs,
  })
}

export function useFoodItemsForSelection() {
  return useQuery({
    queryKey: SUB_QUERY_KEYS.foodItems,
    queryFn: subService.fetchFoodItemsForSelection,
  })
}
