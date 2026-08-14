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
export function checkMenuEditLock(dateStr: string, meal: MealType): MenuLockStatus {
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

  if (meal === 'lunch') {
    // 3:00 PM = 15:00 = 900 minutes
    if (currentMinutes >= 15 * 60) {
      return {
        isLocked: true,
        reason: "Lunch menu for today is closed (Cutoff: 3:00 PM).",
      }
    }
  } else if (meal === 'dinner') {
    // 11:00 PM = 23:00 = 1380 minutes
    if (currentMinutes >= 23 * 60) {
      return {
        isLocked: true,
        reason: "Dinner menu for today is closed (Cutoff: 11:00 PM).",
      }
    }
  } else if (meal === 'breakfast') {
    // 11:00 AM = 11:00 = 660 minutes
    if (currentMinutes >= 11 * 60) {
      return {
        isLocked: true,
        reason: "Breakfast menu for today is closed (Cutoff: 11:00 AM).",
      }
    }
  }

  return { isLocked: false, reason: null }
}
