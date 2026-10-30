import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  type CustomerBillingCycle,
  type SettlePaymentInput,
  fetchCustomerAddresses,
  fetchCustomerById,
  fetchCustomerOrders,
  fetchCustomers,
  fetchReceivablesSummary,
  setCustomerActive,
  setCustomerBillingCycle,
  setCustomerSubscriptionEligible,
  settleOrdersPayment,
} from '@/features/customers/services/customers-service'

export function useCustomers() {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.customers(), queryFn: fetchCustomers })
}

export function useCustomer(id: string) {
  return useQuery({ queryKey: ADMIN_QUERY_KEYS.customer(id), queryFn: () => fetchCustomerById(id) })
}

export function useCustomerOrders(id: string) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.customer(id), 'orders'],
    queryFn: () => fetchCustomerOrders(id),
  })
}

export function useCustomerAddresses(id: string) {
  return useQuery({
    queryKey: [...ADMIN_QUERY_KEYS.customer(id), 'addresses'],
    queryFn: () => fetchCustomerAddresses(id),
  })
}

export function useReceivablesSummary() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.receivablesSummary,
    queryFn: fetchReceivablesSummary,
    refetchInterval: 30000,
  })
}

export function useSetCustomerActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      setCustomerActive(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      toast.success('Customer updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useSetCustomerSubscriptionEligible() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      is_subscription_eligible,
    }: {
      id: string
      is_subscription_eligible: boolean
    }) => setCustomerSubscriptionEligible(id, is_subscription_eligible),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      toast.success('Subscription eligibility updated')
    },
    onError: (error) => toast.error(error.message),
  })
}

export function useSetCustomerBillingCycle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      customerId,
      cycle,
    }: {
      customerId: string
      cycle: CustomerBillingCycle
    }) => {
      setCustomerBillingCycle(customerId, cycle)
      return { customerId, cycle }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customer(variables.customerId) })
      toast.success(`Billing cycle set to ${variables.cycle}`)
    },
  })
}

export function useSettleOrdersPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SettlePaymentInput) => settleOrdersPayment(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.customers() })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.receivablesSummary })
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.dashboardSummary })
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customer'] })
      const count = variables.orderIds.length
      toast.success(`Successfully marked ${count} ${count === 1 ? 'order' : 'orders'} as Paid!`)
    },
    onError: (error) => toast.error(`Failed to record payment: ${error.message}`),
  })
}
