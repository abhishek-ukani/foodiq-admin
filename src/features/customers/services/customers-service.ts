import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type CustomerBillingCycle = 'daily' | 'weekly' | 'monthly'

export interface CustomerWithKhata extends Tables<'profiles'> {
  pending_balance: number
  pending_orders_count: number
  billing_cycle: CustomerBillingCycle
  oldest_unpaid_date: string | null
}

export interface ReceivablesSummary {
  total_pending_amount: number
  total_pending_orders: number
  total_customers_with_dues: number
  daily_pending_amount: number
  daily_pending_orders: number
  weekly_pending_amount: number
  weekly_pending_orders: number
  monthly_pending_amount: number
  monthly_pending_orders: number
}

export interface SettlePaymentInput {
  orderIds: string[]
  paymentMethod: 'cash' | 'upi'
  paymentReference?: string
}

const BILLING_CYCLES_STORAGE_KEY = 'foodiq_customer_billing_cycles'

export function getCustomerBillingCyclesMap(): Record<string, CustomerBillingCycle> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(BILLING_CYCLES_STORAGE_KEY) : null
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setCustomerBillingCycle(customerId: string, cycle: CustomerBillingCycle): void {
  try {
    if (typeof window === 'undefined') return
    const map = getCustomerBillingCyclesMap()
    map[customerId] = cycle
    localStorage.setItem(BILLING_CYCLES_STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

async function syncProfilesOrderStats(
  profiles: Tables<'profiles'>[],
  ordersByUser: Map<string, { count: number; spent: number }>,
) {
  const updates: Promise<any>[] = []
  for (const p of profiles) {
    const stats = ordersByUser.get(p.id) || { count: 0, spent: 0 }
    if (p.total_orders !== stats.count || Number(p.total_spent) !== stats.spent) {
      updates.push(
        Promise.resolve(
          supabase
            .from('profiles')
            .update({ total_orders: stats.count, total_spent: stats.spent })
            .eq('id', p.id),
        ),
      )
    }
  }
  if (updates.length > 0) {
    await Promise.allSettled(updates)
  }
}

export async function fetchCustomers(): Promise<CustomerWithKhata[]> {
  const [profilesRes, ordersRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('id, user_id, total_amount, status, payment_status, placed_at, delivery_date'),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (!profilesRes.data) return []

  const cyclesMap = getCustomerBillingCyclesMap()

  // Aggregate orders by user_id
  const ordersByUser = new Map<
    string,
    {
      count: number
      spent: number
      pending_balance: number
      pending_orders_count: number
      oldest_unpaid_date: string | null
    }
  >()

  if (ordersRes.data) {
    ordersRes.data.forEach((o) => {
      if (!o.user_id) return
      // Exclude cancelled and rejected orders
      if (o.status === 'cancelled' || o.status === 'rejected') return

      const current = ordersByUser.get(o.user_id) || {
        count: 0,
        spent: 0,
        pending_balance: 0,
        pending_orders_count: 0,
        oldest_unpaid_date: null,
      }

      current.count += 1
      current.spent += Number(o.total_amount || 0)

      // Check if order is unpaid
      if (o.payment_status !== 'paid') {
        current.pending_orders_count += 1
        current.pending_balance += Number(o.total_amount || 0)

        const orderDate = o.delivery_date || o.placed_at
        if (orderDate) {
          if (!current.oldest_unpaid_date || dayjs(orderDate).isBefore(dayjs(current.oldest_unpaid_date))) {
            current.oldest_unpaid_date = orderDate
          }
        }
      }

      ordersByUser.set(o.user_id, current)
    })
  }

  // Merge computed stats into profiles
  const customersWithKhata: CustomerWithKhata[] = profilesRes.data.map((p) => {
    const stats = ordersByUser.get(p.id)
    const storedCycle = cyclesMap[p.id]
    // Default to 'weekly' if not set
    const billing_cycle: CustomerBillingCycle = storedCycle || 'weekly'

    return {
      ...p,
      total_orders: stats ? stats.count : (p.total_orders || 0),
      total_spent: stats ? stats.spent : (p.total_spent || 0),
      pending_balance: stats ? stats.pending_balance : 0,
      pending_orders_count: stats ? stats.pending_orders_count : 0,
      billing_cycle,
      oldest_unpaid_date: stats ? stats.oldest_unpaid_date : null,
    }
  })

  // Sync back to database in the background if out of date
  syncProfilesOrderStats(profilesRes.data, ordersByUser).catch(() => {})

  return customersWithKhata
}

export async function fetchCustomerById(id: string): Promise<CustomerWithKhata> {
  const [profileRes, ordersRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('orders')
      .select('id, total_amount, status, payment_status, placed_at, delivery_date')
      .eq('user_id', id),
  ])

  if (profileRes.error) throw profileRes.error
  const p = profileRes.data

  let count = p.total_orders || 0
  let spent = Number(p.total_spent || 0)
  let pending_balance = 0
  let pending_orders_count = 0
  let oldest_unpaid_date: string | null = null

  if (ordersRes.data) {
    const validOrders = ordersRes.data.filter(
      (o) => o.status !== 'cancelled' && o.status !== 'rejected',
    )
    count = validOrders.length
    spent = validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)

    validOrders.forEach((o) => {
      if (o.payment_status !== 'paid') {
        pending_orders_count += 1
        pending_balance += Number(o.total_amount || 0)
        const orderDate = o.delivery_date || o.placed_at
        if (orderDate) {
          if (!oldest_unpaid_date || dayjs(orderDate).isBefore(dayjs(oldest_unpaid_date))) {
            oldest_unpaid_date = orderDate
          }
        }
      }
    })
  }

  if (p.total_orders !== count || Number(p.total_spent) !== spent) {
    Promise.resolve(
      supabase
        .from('profiles')
        .update({ total_orders: count, total_spent: spent })
        .eq('id', id),
    ).catch(() => {})
  }

  const cyclesMap = getCustomerBillingCyclesMap()
  const billing_cycle = cyclesMap[id] || 'weekly'

  return {
    ...p,
    total_orders: count,
    total_spent: spent,
    pending_balance,
    pending_orders_count,
    billing_cycle,
    oldest_unpaid_date,
  }
}

export async function fetchReceivablesSummary(): Promise<ReceivablesSummary> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, user_id, total_amount, status, payment_status, placed_at, delivery_date')

  if (error || !orders) {
    return {
      total_pending_amount: 0,
      total_pending_orders: 0,
      total_customers_with_dues: 0,
      daily_pending_amount: 0,
      daily_pending_orders: 0,
      weekly_pending_amount: 0,
      weekly_pending_orders: 0,
      monthly_pending_amount: 0,
      monthly_pending_orders: 0,
    }
  }

  const now = dayjs()
  const oneDayAgo = now.subtract(1, 'day')
  const sevenDaysAgo = now.subtract(7, 'day')
  const thirtyDaysAgo = now.subtract(30, 'day')

  let total_pending_amount = 0
  let total_pending_orders = 0
  const customersWithDues = new Set<string>()

  let daily_pending_amount = 0
  let daily_pending_orders = 0
  let weekly_pending_amount = 0
  let weekly_pending_orders = 0
  let monthly_pending_amount = 0
  let monthly_pending_orders = 0

  orders.forEach((o) => {
    if (o.status === 'cancelled' || o.status === 'rejected') return
    if (o.payment_status === 'paid') return

    const amount = Number(o.total_amount || 0)
    total_pending_amount += amount
    total_pending_orders += 1
    if (o.user_id) customersWithDues.add(o.user_id)

    const date = dayjs(o.delivery_date || o.placed_at)
    if (date.isAfter(oneDayAgo)) {
      daily_pending_amount += amount
      daily_pending_orders += 1
    }
    if (date.isAfter(sevenDaysAgo)) {
      weekly_pending_amount += amount
      weekly_pending_orders += 1
    }
    if (date.isAfter(thirtyDaysAgo)) {
      monthly_pending_amount += amount
      monthly_pending_orders += 1
    }
  })

  return {
    total_pending_amount,
    total_pending_orders,
    total_customers_with_dues: customersWithDues.size,
    daily_pending_amount,
    daily_pending_orders,
    weekly_pending_amount,
    weekly_pending_orders,
    monthly_pending_amount,
    monthly_pending_orders,
  }
}

export async function settleOrdersPayment({
  orderIds,
  paymentMethod,
  paymentReference,
}: SettlePaymentInput): Promise<void> {
  if (!orderIds || orderIds.length === 0) return

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: 'paid',
      payment_method: paymentMethod,
      payment_reference: paymentReference?.trim() || null,
      paid_at: new Date().toISOString(),
    })
    .in('id', orderIds)

  if (error) throw error
}

export async function fetchCustomerOrders(userId: string): Promise<Tables<'orders'>[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchCustomerAddresses(userId: string): Promise<Tables<'addresses'>[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
  if (error) throw error
  return data
}

export async function setCustomerActive(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update({ is_active }).eq('id', id)
  if (error) throw error
}

export async function setCustomerSubscriptionEligible(
  id: string,
  is_subscription_eligible: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_subscription_eligible })
    .eq('id', id)
  if (error) throw error
}
