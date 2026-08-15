import dayjs from 'dayjs'
import type { MealType } from '@/types/database.types'

export interface MenuLockStatus {
  isLocked: boolean
  reason: string | null
}

/**
 * Checks if editing a daily menu for a given date and meal is locked.
 * - Past dates: ALWAYS locked.
 * - Today Lunch: locked after 3:00 PM (15:00).
 * - Today Dinner: locked after 11:00 PM (23:00).
 * - Today Breakfast: locked after 11:00 AM (11:00).
 * - Future dates: ALWAYS editable.
 */
export function checkMenuEditLock(
  dateStr: string,
  meal: MealType,
  customCutoffTime?: string | null,
): MenuLockStatus {
  const todayStr = dayjs().format('YYYY-MM-DD')

  // 1. Past dates cannot be modified
  if (dayjs(dateStr).isBefore(todayStr, 'day')) {
    return {
      isLocked: true,
      reason: 'Past date menus are archived and cannot be modified.',
    }
  }

  // 2. Future dates are editable
  if (dayjs(dateStr).isAfter(todayStr, 'day')) {
    return { isLocked: false, reason: null }
  }

  // 3. Today cutoff time validation
  const now = dayjs()
  const currentMinutes = now.hour() * 60 + now.minute()

  let cutoffMinutes: number
  let cutoffDisplay: string

  if (customCutoffTime && customCutoffTime.includes(':')) {
    const parts = customCutoffTime.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    cutoffMinutes = h * 60 + m
    cutoffDisplay = dayjs().hour(h).minute(m).format('h:mm A')
  } else {
    // Default fallback cutoffs by meal type if not explicitly set
    if (meal === 'lunch') {
      cutoffMinutes = 15 * 60 // 3:00 PM
      cutoffDisplay = '3:00 PM'
    } else if (meal === 'dinner') {
      cutoffMinutes = 23 * 60 // 11:00 PM
      cutoffDisplay = '11:00 PM'
    } else {
      cutoffMinutes = 11 * 60 // 11:00 AM
      cutoffDisplay = '11:00 AM'
    }
  }

  if (currentMinutes >= cutoffMinutes) {
    const mealName = meal.charAt(0).toUpperCase() + meal.slice(1)
    return {
      isLocked: true,
      reason: `${mealName} menu for today is closed (Cutoff: ${cutoffDisplay}).`,
    }
  }

  return { isLocked: false, reason: null }
}
