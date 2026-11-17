import { supabase } from '@/lib/supabase'
import type { OrderStatus } from '@/types/database.types'

export const ORDERS_REALTIME_CHANNEL = 'foodiq-orders-realtime'
export const ORDER_CREATED_EVENT = 'order_created'
export const ORDER_UPDATED_EVENT = 'order_updated'
export const CATALOG_SYNC_CHANNEL = 'foodiq-catalog-sync'
export const CATALOG_UPDATED_EVENT = 'catalog_updated'

export interface OrderEventPayload {
  id: string
  order_number?: string
  status?: OrderStatus
  user_id?: string
  total_amount?: number
  reason?: string
  delivery_charge?: number
}

// Local cross-tab broadcast channel
let localOrdersChannel: BroadcastChannel | null = null
let localCatalogChannel: BroadcastChannel | null = null

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localOrdersChannel = new BroadcastChannel(ORDERS_REALTIME_CHANNEL)
    localCatalogChannel = new BroadcastChannel(CATALOG_SYNC_CHANNEL)
  }
} catch {
  // BroadcastChannel fallback
}

/**
 * Play an attention-getting synthesized chime when new order arrives in admin.
 */
export function playAdminOrderChime(type: 'new_order' | 'update' = 'new_order') {
  try {
    if (typeof window === 'undefined') return
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    gain.gain.setValueAtTime(0.001, now)

    if (type === 'new_order') {
      // High-attention distinctive 3-tone chime for admin (D5 -> F#5 -> A5)
      osc.frequency.setValueAtTime(587.33, now)
      osc.frequency.setValueAtTime(739.99, now + 0.12)
      osc.frequency.setValueAtTime(880.0, now + 0.24)

      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.75)
    } else {
      osc.frequency.setValueAtTime(880.0, now)
      gain.gain.exponentialRampToValueAtTime(0.12, now + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.4)
    }
  } catch {
    // Non-critical
  }
}

/**
 * Broadcast an order status update to all connected clients (web & admin)
 */
export async function broadcastOrderStatusUpdate(payload: OrderEventPayload) {
  try {
    localOrdersChannel?.postMessage({
      type: ORDER_UPDATED_EVENT,
      payload,
    })
  } catch {
    // Ignore local broadcast error
  }

  try {
    const channel = supabase.channel(ORDERS_REALTIME_CHANNEL)
    await channel.send({
      type: 'broadcast',
      event: ORDER_UPDATED_EVENT,
      payload,
    })
  } catch (err) {
    console.warn('[OrdersRealtime] Failed to broadcast order status update:', err)
  }
}

/**
 * Broadcast a new order creation to all connected clients
 */
export async function broadcastOrderCreated(payload: OrderEventPayload) {
  try {
    localOrdersChannel?.postMessage({
      type: ORDER_CREATED_EVENT,
      payload,
    })
  } catch {
    // Ignore local broadcast error
  }

  try {
    const channel = supabase.channel(ORDERS_REALTIME_CHANNEL)
    await channel.send({
      type: 'broadcast',
      event: ORDER_CREATED_EVENT,
      payload,
    })
  } catch (err) {
    console.warn('[OrdersRealtime] Failed to broadcast order created:', err)
  }
}

/**
 * Broadcast catalog / menu changes to website
 */
export async function broadcastCatalogUpdate(action: string) {
  try {
    localCatalogChannel?.postMessage({ action })
  } catch {
    // Ignore local broadcast error
  }

  try {
    const channel = supabase.channel(CATALOG_SYNC_CHANNEL)
    await channel.send({
      type: 'broadcast',
      event: CATALOG_UPDATED_EVENT,
      payload: { action },
    })
  } catch (err) {
    console.warn('[CatalogRealtime] Failed to broadcast catalog update:', err)
  }
}
