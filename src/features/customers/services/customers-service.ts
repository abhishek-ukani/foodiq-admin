import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export async function fetchCustomers(): Promise<Tables<'profiles'>[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function fetchCustomerById(id: string): Promise<Tables<'profiles'>> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data
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

