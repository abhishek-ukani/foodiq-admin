import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import type { Database, Tables } from '@/types/database.types'

type Functions = Database['public']['Functions']

export interface DashboardSummary {
  todays_orders: number
  todays_revenue: number
  pending_orders: number
  active_orders: number
  month_revenue: number
  month_orders: number
  average_order_value: number
  total_customers: number
  new_customers_this_month: number
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data, error } = await supabase.rpc('report_dashboard_summary', {})
  if (error) throw error
  return data as unknown as DashboardSummary
}

export type SalesPoint = Functions['report_sales_series']['Returns'][number]

export async function fetchSalesSeries(days = 30): Promise<SalesPoint[]> {
  const to = dayjs().format('YYYY-MM-DD')
  const from = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
  const { data, error } = await supabase.rpc('report_sales_series', {
    p_from: from,
    p_to: to,
    p_granularity: 'day',
  })
  if (error) throw error
  return data
}

export type PopularItemRow = Functions['report_popular_items']['Returns'][number]

export async function fetchTopSellingItems(days = 30, limit = 5): Promise<PopularItemRow[]> {
  const to = dayjs().format('YYYY-MM-DD')
  const from = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')
  const { data, error } = await supabase.rpc('report_popular_items', {
    p_from: from,
    p_to: to,
    p_limit: limit,
  })
  if (error) throw error
  return data
}

export async function fetchRecentOrders(limit = 8): Promise<Tables<'orders'>[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
