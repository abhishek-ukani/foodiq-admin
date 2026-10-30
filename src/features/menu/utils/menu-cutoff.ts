import dayjs from 'dayjs'
import type { MealType } from '@/types/database.types'

export interface MenuLockStatus {
  isLocked: boolean
  reason: string | null
  isCustomerCutoffPassed?: boolean
  cutoffDisplay?: string | null
}

export const DEFAULT_LUNCH_CUTOFF = '10:00'
export const DEFAULT_DINNER_CUTOFF = '18:00'

export function getDefaultCutoffForMeal(meal: MealType): string {
  return meal === 'lunch' ? DEFAULT_LUNCH_CUTOFF : DEFAULT_DINNER_CUTOFF
}

/**
 * Checks if editing a daily menu for a given date and meal is locked for the admin.
 * - Past dates: ALWAYS locked (archived).
 * - Today: ALWAYS editable by admin (isLocked: false). If customer ordering cutoff passed,
 *   isCustomerCutoffPassed is true so an informational banner can be shown.
 * - Future dates: ALWAYS editable (isLocked: false).
 */
export function checkMenuEditLock(
  dateStr: string,
  meal: MealType,
  customCutoffTime?: string | null,
  configuredDefaultCutoff?: string | null,
): MenuLockStatus {
  const todayStr = dayjs().format('YYYY-MM-DD')

  // 1. Past dates cannot be modified (archived history)
  if (dayjs(dateStr).isBefore(todayStr, 'day')) {
    return {
      isLocked: true,
      reason: 'Past date menus are archived and cannot be modified.',
      isCustomerCutoffPassed: true,
      cutoffDisplay: null,
    }
  }

  // 2. Future dates are editable
  if (dayjs(dateStr).isAfter(todayStr, 'day')) {
    return {
      isLocked: false,
      reason: null,
      isCustomerCutoffPassed: false,
      cutoffDisplay: null,
    }
  }

  // 3. Today: evaluate customer ordering cutoff for operational visibility
  const now = dayjs()
  const currentMinutes = now.hour() * 60 + now.minute()

  const effectiveCutoff =
    customCutoffTime && customCutoffTime.includes(':')
      ? customCutoffTime
      : configuredDefaultCutoff && configuredDefaultCutoff.includes(':')
        ? configuredDefaultCutoff
        : getDefaultCutoffForMeal(meal)

  let cutoffMinutes: number | null = null
  let cutoffDisplay: string | null = null

  if (effectiveCutoff && effectiveCutoff.includes(':')) {
    const parts = effectiveCutoff.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    cutoffMinutes = h * 60 + m
    cutoffDisplay = dayjs().hour(h).minute(m).format('h:mm A')
  }

  const isCutoffPassed = cutoffMinutes !== null && currentMinutes >= cutoffMinutes

  return {
    isLocked: false,
    reason: null,
    isCustomerCutoffPassed: isCutoffPassed,
    cutoffDisplay,
  }
}
