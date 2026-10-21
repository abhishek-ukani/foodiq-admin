import { supabase } from '@/lib/supabase'
import type { HolidaySettings, KitchenHoliday } from '@/features/settings/schemas/settings-schemas'

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

/** Saves the holiday settings to system_config */
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
}
