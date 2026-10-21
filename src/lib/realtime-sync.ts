import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export const CATALOG_SYNC_CHANNEL = 'foodiq-catalog-sync'
export const CATALOG_UPDATED_EVENT = 'catalog_updated'

let syncChannel: RealtimeChannel | null = null
let localBroadcastChannel: BroadcastChannel | null = null

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    localBroadcastChannel = new BroadcastChannel(CATALOG_SYNC_CHANNEL)
  }
} catch {
  // Graceful fallback if BroadcastChannel is restricted
}

function getOrCreateChannel(): RealtimeChannel {
  if (!syncChannel) {
    syncChannel = supabase.channel(CATALOG_SYNC_CHANNEL, {
      config: {
        broadcast: { ack: false, self: true },
      },
    })
    syncChannel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        // Reset on error so next call can re-establish
        syncChannel = null
      }
    })
  }
  return syncChannel
}

/**
 * Broadcasts a real-time event to foodIQ_web and any other connected clients
 * whenever products, menu, stock, categories, or variants change.
 */
export async function broadcastCatalogUpdate(reason: string = 'updated'): Promise<void> {
  const payload = {
    reason,
    timestamp: Date.now(),
  }

  // 1. Send via local browser BroadcastChannel (instant for tabs on same browser origin)
  try {
    localBroadcastChannel?.postMessage(payload)
  } catch {
    // Ignore local broadcast error
  }

  // 2. Send via Supabase Realtime Broadcast (instant for all tabs, devices & networks)
  try {
    const channel = getOrCreateChannel()
    await channel.send({
      type: 'broadcast',
      event: CATALOG_UPDATED_EVENT,
      payload,
    })
  } catch (error) {
    console.warn('[RealtimeSync] Could not send catalog update broadcast:', error)
  }
}
