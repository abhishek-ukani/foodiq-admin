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
  // First attempt RPC if available
  try {
    const { data, error } = await supabase.rpc('report_dashboard_summary', {})
    if (!error && data && typeof data === 'object') {
      return data as unknown as DashboardSummary
    }
  } catch {
    // Fall back to direct database query
  }

  // Direct calculation from real orders in Supabase
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, total_amount, status, payment_status, placed_at, delivery_date, created_at, user_id, contact_phone')

  if (error || !orders) {
    return {
      todays_orders: 0,
      todays_revenue: 0,
      pending_orders: 0,
      active_orders: 0,
      month_revenue: 0,
      month_orders: 0,
      average_order_value: 0,
      total_customers: 0,
      new_customers_this_month: 0,
    }
  }

  const todayStr = dayjs().format('YYYY-MM-DD')
  const startOfMonth = dayjs().startOf('month')

  let todays_orders = 0
  let todays_revenue = 0
  let pending_orders = 0
  let active_orders = 0
  let month_revenue = 0
  let month_orders = 0
  const uniqueCustomers = new Set<string>()

  orders.forEach((o) => {
    const isCancelled = o.status === 'cancelled' || o.status === 'rejected'
    const orderDate = o.delivery_date
      ? dayjs(o.delivery_date).format('YYYY-MM-DD')
      : o.placed_at
      ? dayjs(o.placed_at).format('YYYY-MM-DD')
      : dayjs(o.created_at).format('YYYY-MM-DD')

    const createdAt = dayjs(o.created_at || o.placed_at)

    const custKey = o.user_id || o.contact_phone
    if (custKey) uniqueCustomers.add(custKey)

    if (o.status === 'pending') {
      pending_orders++
    }

    if (['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)) {
      active_orders++
    }

    if (!isCancelled) {
      if (orderDate === todayStr) {
        todays_orders++
        todays_revenue += Number(o.total_amount || 0)
      }

      if (createdAt.isAfter(startOfMonth) || createdAt.isSame(startOfMonth, 'day')) {
        month_orders++
        month_revenue += Number(o.total_amount || 0)
      }
    }
  })

  const average_order_value = month_orders > 0 ? Math.round(month_revenue / month_orders) : 0

  return {
    todays_orders,
    todays_revenue,
    pending_orders,
    active_orders,
    month_revenue,
    month_orders,
    average_order_value,
    total_customers: uniqueCustomers.size,
    new_customers_this_month: uniqueCustomers.size,
  }
}

export type SalesPoint = {
  bucket: string
  order_count: number
  delivered_count: number
  revenue: number
  average_order_value: number
}

export async function fetchSalesSeries(days = 30): Promise<SalesPoint[]> {
  const to = dayjs().format('YYYY-MM-DD')
  const from = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')

  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('report_sales_series', {
      p_from: from,
      p_to: to,
      p_granularity: 'day',
    })
    if (!error && Array.isArray(data)) {
      return data
    }
  } catch {
    // Fall back to direct database query
  }

  // Direct calculation from orders table
  const fromDate = dayjs().subtract(days - 1, 'day').startOf('day')
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, status, payment_status, placed_at, delivery_date, created_at')
    .gte('created_at', fromDate.toISOString())

  const buckets: Record<string, SalesPoint> = {}
  for (let i = 0; i < days; i++) {
    const d = dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD')
    buckets[d] = {
      bucket: d,
      order_count: 0,
      delivered_count: 0,
      revenue: 0,
      average_order_value: 0,
    }
  }

  orders?.forEach((o) => {
    if (o.status === 'cancelled' || o.status === 'rejected') return
    const d = o.delivery_date
      ? dayjs(o.delivery_date).format('YYYY-MM-DD')
      : dayjs(o.created_at).format('YYYY-MM-DD')

    if (buckets[d]) {
      buckets[d].order_count++
      if (o.status === 'delivered') {
        buckets[d].delivered_count++
      }
      const amount = Number(o.total_amount || 0)
      buckets[d].revenue += amount
    }
  })

  Object.values(buckets).forEach((b) => {
    b.average_order_value = b.order_count > 0 ? Math.round(b.revenue / b.order_count) : 0
  })

  return Object.values(buckets)
}

export type PopularItemRow = {
  food_item_id: string
  item_name: string
  item_kind: string
  image_url: string | null
  units_sold: number
  revenue: number
  order_count: number
}

export async function fetchTopSellingItems(days = 30, limit = 5): Promise<PopularItemRow[]> {
  const to = dayjs().format('YYYY-MM-DD')
  const from = dayjs().subtract(days - 1, 'day').format('YYYY-MM-DD')

  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('report_popular_items', {
      p_from: from,
      p_to: to,
      p_limit: limit,
    })
    if (!error && Array.isArray(data)) {
      return data as PopularItemRow[]
    }
  } catch {
    // Fall back to direct database query
  }

  // Direct calculation from order_items table
  const fromDate = dayjs().subtract(days - 1, 'day').startOf('day')
  const { data: items } = await supabase
    .from('order_items')
    .select('id, food_item_id, item_name, item_kind, item_image_url, quantity, line_total, orders!inner(status, created_at)')
    .gte('orders.created_at', fromDate.toISOString())
    .not('orders.status', 'in', '("cancelled","rejected")')

  const itemMap = new Map<string, PopularItemRow>()

  items?.forEach((i: any) => {
    const key = i.food_item_id || i.item_name
    const existing = itemMap.get(key)
    const qty = Number(i.quantity || 1)
    const rev = Number(i.line_total || 0)

    if (existing) {
      existing.units_sold += qty
      existing.revenue += rev
      existing.order_count += 1
    } else {
      itemMap.set(key, {
        food_item_id: i.food_item_id || key,
        item_name: i.item_name,
        item_kind: i.item_kind || 'single',
        image_url: i.item_image_url || null,
        units_sold: qty,
        revenue: rev,
        order_count: 1,
      })
    }
  })

  return Array.from(itemMap.values())
    .sort((a, b) => b.units_sold - a.units_sold || b.revenue - a.revenue)
    .slice(0, limit)
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
