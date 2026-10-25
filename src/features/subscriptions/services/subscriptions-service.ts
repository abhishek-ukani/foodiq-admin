import { supabase } from '@/lib/supabase'
import type {
  PlanVariantRow,
  SubscriptionSettingsRow,
  KitchenClosedDateRow,
  SubscriptionRow,
  SubscriptionDayRow,
  PlanEnquiryRow,
  AuditLogRow,
  FoodItemRow,
  TablesInsert,
  TablesUpdate,
} from '@/types/database.types'

export type { SubscriptionDayRow }

export type AdminSubscriptionWithDetails = SubscriptionRow & {
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null
  addresses: { address_line1: string; address_line2: string | null; city: string; state: string; pincode: string } | null
  plan_variants: { name: string; slug: string } | null
  meal_thalis?: { id: string; name: string; price: number } | null
}

export type TomorrowPrepSummary = {
  targetDate: string
  lunchCount: number
  dinnerCount: number
  bothCount: number
  totalMeals: number
  sweetsCount: number
  mealBreakdown: Record<string, number>
  deliveries: (SubscriptionDayRow & {
    subscriptions: {
      subscription_number: string
      user_id: string
      meal_thali_id?: string | null
      thali_snapshot?: any
      meal_thalis?: { id: string; name: string } | null
      profiles: { full_name: string | null; phone: string | null } | null
      addresses: { address_line1: string; city: string } | null
    }
    meal_thalis?: { id: string; name: string } | null
  })[]
}

// ---------------------------------------------------------------------------
// Plan Variants
// ---------------------------------------------------------------------------
export async function fetchPlanVariants(): Promise<PlanVariantRow[]> {
  const { data, error } = await supabase
    .from('plan_variants')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw error
  return (data || []) as PlanVariantRow[]
}

export async function createPlanVariant(
  input: TablesInsert<'plan_variants'>,
): Promise<PlanVariantRow> {
  const { data, error } = await supabase
    .from('plan_variants')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data as PlanVariantRow
}

export async function updatePlanVariant(
  id: string,
  input: TablesUpdate<'plan_variants'>,
): Promise<PlanVariantRow> {
  const { data, error } = await supabase
    .from('plan_variants')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PlanVariantRow
}

export async function deletePlanVariant(id: string): Promise<void> {
  const { error } = await supabase.from('plan_variants').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Global Settings
// ---------------------------------------------------------------------------
export async function fetchSubscriptionSettings(): Promise<SubscriptionSettingsRow> {
  const { data, error } = await supabase
    .from('subscription_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) {
    throw new Error('Subscription settings not initialized in database')
  }
  return data as SubscriptionSettingsRow
}

export async function updateSubscriptionSettings(
  input: TablesUpdate<'subscription_settings'>,
): Promise<SubscriptionSettingsRow> {
  const { data: userRes } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('subscription_settings')
    .update({
      ...input,
      updated_by: userRes.user?.id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single()

  if (error) throw error
  return data as SubscriptionSettingsRow
}

// ---------------------------------------------------------------------------
// Closed Dates
// ---------------------------------------------------------------------------
export async function fetchKitchenClosedDates(): Promise<KitchenClosedDateRow[]> {
  const { data, error } = await supabase
    .from('kitchen_closed_dates')
    .select('*')
    .order('closed_date', { ascending: true })

  if (error) throw error
  return (data || []) as KitchenClosedDateRow[]
}

export async function closeDate(closedDate: string, reason?: string | null): Promise<any> {
  const { data, error } = await supabase.rpc('admin_close_date', {
    p_closed_date: closedDate,
    p_reason: reason ?? null,
  })
  if (error) throw error
  return data
}

export async function reopenDate(closedDate: string): Promise<any> {
  const { data, error } = await supabase.rpc('admin_reopen_date', {
    p_closed_date: closedDate,
  })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Subscriptions List & Details
// ---------------------------------------------------------------------------
export async function fetchSubscriptions(
  statusFilter?: string,
  search?: string,
): Promise<AdminSubscriptionWithDetails[]> {
  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      profiles:user_id(full_name, email, phone),
      addresses:address_id(address_line1, address_line2, city, state, pincode),
      plan_variants:plan_variant_id(name, slug),
      meal_thalis:meal_thali_id(id, name, price)
    `)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as any)
  }

  const { data, error } = await query
  if (error) throw error

  let items = (data || []) as unknown as AdminSubscriptionWithDetails[]

  if (search && search.trim()) {
    const q = search.toLowerCase().trim()
    items = items.filter(
      (sub) =>
        sub.subscription_number?.toLowerCase().includes(q) ||
        sub.profiles?.full_name?.toLowerCase().includes(q) ||
        sub.profiles?.phone?.includes(q) ||
        sub.profiles?.email?.toLowerCase().includes(q),
    )
  }

  return items
}

export async function fetchSubscriptionLedger(
  subscriptionId: string,
): Promise<SubscriptionDayRow[]> {
  const { data, error } = await supabase
    .from('subscription_days')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .order('sequence_number', { ascending: true })

  if (error) throw error
  return (data || []) as SubscriptionDayRow[]
}

export async function confirmSubscriptionPayment(
  subscriptionId: string,
  paymentNotes?: string | null,
): Promise<any> {
  const { data, error } = await supabase.rpc('admin_confirm_payment', {
    p_subscription_id: subscriptionId,
    p_payment_notes: paymentNotes ?? null,
  })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Tomorrow's Prep List & Order Generator
// ---------------------------------------------------------------------------
export async function fetchTomorrowPrepList(
  targetDateStr: string,
): Promise<TomorrowPrepSummary> {
  const { data, error } = await supabase
    .from('subscription_days')
    .select(`
      *,
      meal_thalis:meal_thali_id(id, name),
      subscriptions:subscription_id(
        subscription_number,
        user_id,
        meal_thali_id,
        thali_snapshot,
        meal_thalis:meal_thali_id(id, name),
        profiles:user_id(full_name, phone),
        addresses:address_id(address_line1, city)
      )
    `)
    .eq('delivery_date', targetDateStr)
    .eq('status', 'scheduled')

  if (error) throw error

  const deliveries = (data || []) as any[]

  let lunchCount = 0
  let dinnerCount = 0
  let bothCount = 0
  let sweetsCount = 0
  const mealBreakdown: Record<string, number> = {}

  for (const d of deliveries) {
    if (d.meal_slot === 'lunch') lunchCount++
    else if (d.meal_slot === 'dinner') dinnerCount++
    else if (d.meal_slot === 'both') {
      bothCount++
      lunchCount++
      dinnerCount++
    }
    if (d.includes_sweet) sweetsCount++

    const thaliName =
      d.meal_thalis?.name ||
      d.subscriptions?.meal_thalis?.name ||
      d.subscriptions?.thali_snapshot?.name ||
      'Regular Thali'
    mealBreakdown[thaliName] = (mealBreakdown[thaliName] || 0) + (d.meal_slot === 'both' ? 2 : 1)
  }

  return {
    targetDate: targetDateStr,
    lunchCount,
    dinnerCount,
    bothCount,
    totalMeals: lunchCount + dinnerCount,
    sweetsCount,
    mealBreakdown,
    deliveries,
  }
}

export async function triggerDailyOrderGeneration(targetDate?: string): Promise<any> {
  const { data, error } = await supabase.rpc('generate_daily_orders', {
    p_target_date: targetDate ?? null,
  })
  if (error) throw error
  return data
}

// ---------------------------------------------------------------------------
// Plan Enquiries
// ---------------------------------------------------------------------------
export async function fetchPlanEnquiries(
  statusFilter?: string,
): Promise<PlanEnquiryRow[]> {
  let query = supabase
    .from('plan_enquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter as any)
  }

  const { data, error } = await query
  if (error) throw error
  return (data || []) as PlanEnquiryRow[]
}

export async function updatePlanEnquiryStatus(
  id: string,
  status: 'new' | 'in_progress' | 'resolved' | 'closed',
  adminNotes?: string | null,
): Promise<PlanEnquiryRow> {
  const { data, error } = await supabase
    .from('plan_enquiries')
    .update({
      status,
      admin_notes: adminNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PlanEnquiryRow
}

// ---------------------------------------------------------------------------
// Audit Log
// ---------------------------------------------------------------------------
export async function fetchSubscriptionAuditLogs(): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .in('entity_type', ['plan_variants', 'subscription_settings', 'kitchen_closed_dates'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data || []) as AuditLogRow[]
}

// ---------------------------------------------------------------------------
// Food Items lookup (for selecting sweets or base thali)
// ---------------------------------------------------------------------------
export async function fetchFoodItemsForSelection(): Promise<FoodItemRow[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*')
    .eq('is_available', true)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as FoodItemRow[]
}
