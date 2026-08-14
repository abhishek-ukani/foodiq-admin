import { useQuery } from '@tanstack/react-query'
import {
  fetchCustomerReport,
  fetchPopularItems,
  fetchRetention,
  fetchSalesSeries,
} from '@/features/reports/services/reports-service'

export function useSalesReport(from: string, to: string, granularity: 'day' | 'month' | 'year') {
  return useQuery({
    queryKey: ['admin', 'reports', 'sales', from, to, granularity],
    queryFn: () => fetchSalesSeries(from, to, granularity),
  })
}

export function usePopularItemsReport(from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'popular-items', from, to],
    queryFn: () => fetchPopularItems(from, to, 20),
  })
}

export function useCustomerReport(from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'customers', from, to],
    queryFn: () => fetchCustomerReport(from, to, 50),
  })
}

export function useRetentionReport(from: string, to: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'retention', from, to],
    queryFn: () => fetchRetention(from, to),
  })
}
