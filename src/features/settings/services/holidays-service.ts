import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import type { HolidaySettings, KitchenHoliday } from '@/features/settings/schemas/settings-schemas'
import { closeDate, reopenDate } from '@/features/subscriptions/services/subscriptions-service'

export const HOLIDAYS_CONFIG_KEY = 'kitchen_holidays'

export const DEFAULT_HOLIDAY_SETTINGS: HolidaySettings = {
  enabled: true,
  holidays: [],
}

/** Fetches the configured kitchen holidays & closure rules from system_config */
export async function fetchHolidaySettings(): Promise<HolidaySettings> {
  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', HOLIDAYS_CONFIG_KEY)
    .maybeSingle()

  if (error) throw error

  if (data?.value && typeof data.value === 'object') {
    const val = data.value as any
    return {
      enabled: typeof val.enabled === 'boolean' ? val.enabled : true,
      holidays: Array.isArray(val.holidays) ? (val.holidays as KitchenHoliday[]) : [],
    }
  }

  return DEFAULT_HOLIDAY_SETTINGS
}

/** 
 * Saves the holiday settings to system_config AND synchronizes
 * active holiday dates with subscription meal ledgers via admin_close_date / admin_reopen_date.
 */
export async function saveHolidaySettings(settings: HolidaySettings): Promise<void> {
  const { data: session } = await supabase.auth.getUser()
  const { error } = await supabase
    .from('system_config')
    .upsert(
      {
        key: HOLIDAYS_CONFIG_KEY,
        value: settings as any,
        description: 'Kitchen holidays and multi-day closure updates',
        is_public: true,
        updated_by: session.user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

  if (error) throw error

  // Calculate desired closed dates from active holidays
  const desiredClosedDatesMap = new Map<string, string>()

  if (settings.enabled) {
    for (const h of settings.holidays) {
      if (!h.isActive) continue
      const start = dayjs(h.startDate)
      const end = dayjs(h.endDate)
      if (!start.isValid() || !end.isValid()) continue

      let cur = start
      while (cur.isBefore(end) || cur.isSame(end, 'day')) {
        desiredClosedDatesMap.set(cur.format('YYYY-MM-DD'), h.title || 'Kitchen Holiday')
        cur = cur.add(1, 'day')
      }
    }
  }

  // Synchronize with kitchen_closed_dates and subscription ledgers
  try {
    const { data: existingClosed } = await supabase
      .from('kitchen_closed_dates')
      .select('closed_date')

    const existingDates = new Set((existingClosed || []).map((r: any) => r.closed_date))

    // Close any newly scheduled holiday date
    for (const [dateStr, reason] of desiredClosedDatesMap.entries()) {
      if (!existingDates.has(dateStr)) {
        await closeDate(dateStr, reason)
      }
    }

    // Reopen any date that was removed or deactivated
    for (const dateStr of existingDates) {
      if (!desiredClosedDatesMap.has(dateStr)) {
        await reopenDate(dateStr)
      }
    }
  } catch (syncErr) {
    console.error('Failed to sync holidays with subscription ledger:', syncErr)
  }
}
