import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

// Banners -------------------------------------------------------------------
export async function fetchBanners(): Promise<Tables<'banners'>[]> {
  const { data, error } = await supabase.from('banners').select('*').order('display_order')
  if (error) throw error
  return data
}
export async function createBanner(input: TablesInsert<'banners'>): Promise<void> {
  const { error } = await supabase.from('banners').insert(input)
  if (error) throw error
}
export async function updateBanner(id: string, input: TablesUpdate<'banners'>): Promise<void> {
  const { error } = await supabase.from('banners').update(input).eq('id', id)
  if (error) throw error
}
export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) throw error
}

// Testimonials ----------------------------------------------------------------
export async function fetchTestimonials(): Promise<Tables<'testimonials'>[]> {
  const { data, error } = await supabase.from('testimonials').select('*').order('display_order')
  if (error) throw error
  return data
}
export async function createTestimonial(input: TablesInsert<'testimonials'>): Promise<void> {
  const { error } = await supabase.from('testimonials').insert(input)
  if (error) throw error
}
export async function updateTestimonial(
  id: string,
  input: TablesUpdate<'testimonials'>,
): Promise<void> {
  const { error } = await supabase.from('testimonials').update(input).eq('id', id)
  if (error) throw error
}
export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from('testimonials').delete().eq('id', id)
  if (error) throw error
}

// FAQs ------------------------------------------------------------------------
export async function fetchFaqs(): Promise<Tables<'faqs'>[]> {
  const { data, error } = await supabase.from('faqs').select('*').order('display_order')
  if (error) throw error
  return data
}
export async function createFaq(input: TablesInsert<'faqs'>): Promise<void> {
  const { error } = await supabase.from('faqs').insert(input)
  if (error) throw error
}
export async function updateFaq(id: string, input: TablesUpdate<'faqs'>): Promise<void> {
  const { error } = await supabase.from('faqs').update(input).eq('id', id)
  if (error) throw error
}
export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from('faqs').delete().eq('id', id)
  if (error) throw error
}

// Policies ----------------------------------------------------------------
export async function fetchPolicies(): Promise<Tables<'policies'>[]> {
  const { data, error } = await supabase.from('policies').select('*').order('slug')
  if (error) throw error
  return data
}
export async function updatePolicy(id: string, input: TablesUpdate<'policies'>): Promise<void> {
  const { error } = await supabase.from('policies').update(input).eq('id', id)
  if (error) throw error
}

// Contact messages ----------------------------------------------------------
export async function fetchContactMessages(): Promise<Tables<'contact_messages'>[]> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
export async function updateContactMessageStatus(
  id: string,
  status: Tables<'contact_messages'>['status'],
): Promise<void> {
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
  if (error) throw error
}
