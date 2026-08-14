import { supabase } from '@/lib/supabase'
import { getDefaultBranchId } from '@/lib/default-branch'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Delivery Areas (Legacy)
// ---------------------------------------------------------------------------

export async function fetchDeliveryAreas(): Promise<Tables<'delivery_areas'>[]> {
  const { data, error } = await supabase.from('delivery_areas').select('*').order('name')
  if (error) throw error
  return data
}

export async function createDeliveryArea(
  input: Omit<TablesInsert<'delivery_areas'>, 'branch_id'>,
): Promise<void> {
  const branch_id = await getDefaultBranchId()
  const { error } = await supabase.from('delivery_areas').insert({ ...input, branch_id })
  if (error) throw error
}

export async function updateDeliveryArea(
  id: string,
  input: TablesUpdate<'delivery_areas'>,
): Promise<void> {
  const { error } = await supabase.from('delivery_areas').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteDeliveryArea(id: string): Promise<void> {
  const { error } = await supabase.from('delivery_areas').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Delivery Zones (Pre-classified localities: FREE, PAID, BLOCKED)
// ---------------------------------------------------------------------------

export async function fetchDeliveryZones(): Promise<Tables<'delivery_zones'>[]> {
  const { data, error } = await supabase.from('delivery_zones').select('*').order('id', { ascending: true })
  if (error) throw error
  return data
}

export async function createDeliveryZone(
  input: TablesInsert<'delivery_zones'>,
): Promise<void> {
  const { error } = await supabase.from('delivery_zones').insert(input)
  if (error) throw error
}

export async function updateDeliveryZone(
  id: number,
  input: TablesUpdate<'delivery_zones'>,
): Promise<void> {
  const { error } = await supabase.from('delivery_zones').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteDeliveryZone(id: number): Promise<void> {
  const { error } = await supabase.from('delivery_zones').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Delivery Fee Rules (Distance tiers: min_distance_km, max_distance_km, fee)
// ---------------------------------------------------------------------------

export async function fetchDeliveryFeeRules(): Promise<Tables<'delivery_fee_rules'>[]> {
  const { data, error } = await supabase.from('delivery_fee_rules').select('*').order('min_distance_km', { ascending: true })
  if (error) throw error
  return data
}

export async function createDeliveryFeeRule(
  input: TablesInsert<'delivery_fee_rules'>,
): Promise<void> {
  const { error } = await supabase.from('delivery_fee_rules').insert(input)
  if (error) throw error
}

export async function updateDeliveryFeeRule(
  id: number,
  input: TablesUpdate<'delivery_fee_rules'>,
): Promise<void> {
  const { error } = await supabase.from('delivery_fee_rules').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteDeliveryFeeRule(id: number): Promise<void> {
  const { error } = await supabase.from('delivery_fee_rules').delete().eq('id', id)
  if (error) throw error
}

// ---------------------------------------------------------------------------
// Delivery Slots
// ---------------------------------------------------------------------------

export async function fetchDeliverySlots(): Promise<Tables<'delivery_slots'>[]> {
  const { data, error } = await supabase.from('delivery_slots').select('*').order('display_order')
  if (error) throw error
  return data
}

export async function createDeliverySlot(
  input: Omit<TablesInsert<'delivery_slots'>, 'branch_id'>,
): Promise<void> {
  const branch_id = await getDefaultBranchId()
  const { error } = await supabase.from('delivery_slots').insert({ ...input, branch_id })
  if (error) throw error
}

export async function updateDeliverySlot(
  id: string,
  input: TablesUpdate<'delivery_slots'>,
): Promise<void> {
  const { error } = await supabase.from('delivery_slots').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteDeliverySlot(id: string): Promise<void> {
  const { error } = await supabase.from('delivery_slots').delete().eq('id', id)
  if (error) throw error
}
