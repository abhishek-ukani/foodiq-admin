import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Functions = Database['public']['Functions']

export type SalesPoint = Functions['report_sales_series']['Returns'][number]
export type PopularItemRow = Functions['report_popular_items']['Returns'][number]
export type CustomerReportRow = Functions['report_customers']['Returns'][number]

export interface RetentionSummary {
  active_customers: number
  repeat_customers: number
  one_time_customers: number
  repeat_rate: number
  average_orders_per_customer: number
}

export async function fetchSalesSeries(
  from: string,
  to: string,
  granularity: 'day' | 'month' | 'year' = 'day',
): Promise<SalesPoint[]> {
  const { data, error } = await supabase.rpc('report_sales_series', {
    p_from: from,
    p_to: to,
    p_granularity: granularity,
  })
  if (error) throw error
  return data
}

export async function fetchPopularItems(
  from: string,
  to: string,
  limit = 20,
): Promise<PopularItemRow[]> {
  const { data, error } = await supabase.rpc('report_popular_items', {
    p_from: from,
    p_to: to,
    p_limit: limit,
  })
  if (error) throw error
  return data
}

export async function fetchCustomerReport(
  from: string,
  to: string,
  limit = 50,
): Promise<CustomerReportRow[]> {
  const { data, error } = await supabase.rpc('report_customers', {
    p_from: from,
    p_to: to,
    p_limit: limit,
  })
  if (error) throw error
  return data
}

export async function fetchRetention(from: string, to: string): Promise<RetentionSummary> {
  const { data, error } = await supabase.rpc('report_retention', { p_from: from, p_to: to })
  if (error) throw error
  return data as unknown as RetentionSummary
}
