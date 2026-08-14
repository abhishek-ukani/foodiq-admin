import { useQuery } from '@tanstack/react-query'
import { ADMIN_QUERY_KEYS } from '@/constants'
import {
  fetchDashboardSummary,
  fetchRecentOrders,
  fetchSalesSeries,
  fetchTopSellingItems,
} from '@/features/dashboard/services/dashboard-service'

export function useDashboardSummary() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.dashboardSummary,
    queryFn: fetchDashboardSummary,
    refetchInterval: 60_000,
  })
}

export function useSalesSeries(days = 30) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.salesSeries(days),
    queryFn: () => fetchSalesSeries(days),
  })
}

export function useTopSellingItems(days = 30, limit = 5) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.topSellingItems(days, limit),
    queryFn: () => fetchTopSellingItems(days, limit),
  })
}

export function useRecentOrders(limit = 8) {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.recentOrders(limit),
    queryFn: () => fetchRecentOrders(limit),
  })
}
