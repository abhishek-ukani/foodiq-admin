import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  fetchCustomerAddresses,
  fetchCustomerById,
  fetchCustomerOrders,
  fetchCustomers,
  setCustomerActive,
  setCustomerSubscriptionEligible,
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

