import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import type {
  ExpenseCategory,
  ExpenseRecord,
  ExpenseSummary,
  CategoryBreakdown,
  ExpenseSpender,
} from '../types'
import { downloadCsv } from '@/lib/csv-export'

const CATEGORIES_STORAGE_KEY = 'foodiq_kitchen_expense_categories'
const EXPENSES_STORAGE_KEY = 'foodiq_kitchen_expenses'
const SPENDERS_STORAGE_KEY = 'foodiq_kitchen_expense_spenders'

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'cat-veggies',
    name: 'Veggies & Fruits',
    color: '#10b981', // emerald-500
    iconName: 'Carrot',
    description: 'Fresh vegetables, mandi runs, herbs, and fruits',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-groceries',
    name: 'Groceries & Staples',
    color: '#f59e0b', // amber-500
    iconName: 'ShoppingBag',
    description: 'Flour, rice, cooking oil, spices, pulses, and dry goods',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-petrol',
    name: 'Petrol & Fuel',
    color: '#ef4444', // red-500
    iconName: 'Fuel',
    description: 'Vehicle petrol for kitchen market runs and delivery transport',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-equipment',
    name: 'New Purchases & Equipment',
    color: '#3b82f6', // blue-500
    iconName: 'UtensilsCrossed',
    description: 'New utensils, pans, mixer, knives, and kitchen appliances',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-dairy',
    name: 'Dairy Products',
    color: '#06b6d4', // cyan-500
    iconName: 'Milk',
    description: 'Milk, paneer, curd, butter, and cheese',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-packaging',
    name: 'Packaging & Disposables',
    color: '#8b5cf6', // purple-500
    iconName: 'Package',
    description: 'Thali meal boxes, plastic containers, paper bags, tape',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-gas',
    name: 'Gas & Utilities',
    color: '#f97316', // orange-500
    iconName: 'Flame',
    description: 'Commercial LPG cylinders, water jars, electricity',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-repairs',
    name: 'Repairs & Maintenance',
    color: '#64748b', // slate-500
    iconName: 'Wrench',
    description: 'Burner service, deep chimney cleaning, plumbing, repairs',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

/* ================== SUPER USERS / SPENDERS ================== */

/**
 * Fetches real admin profiles live from Supabase (`profiles` table where role = 'admin').
 * Absolutely NO fake or hardcoded profiles.
 */
export async function fetchAdminProfiles(): Promise<ExpenseSpender[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .eq('role', 'admin')
      .order('full_name')

    if (error) {
      console.warn('Failed to fetch admin profiles from Supabase:', error.message)
      return getExpenseSpenders()
    }

    if (data && data.length > 0) {
      const realAdmins: ExpenseSpender[] = data.map((profile) => ({
        id: profile.id,
        name: profile.full_name || profile.email || 'Admin',
        role: 'Admin',
        email: profile.email || undefined,
        phone: profile.phone || undefined,
      }))
      localStorage.setItem(SPENDERS_STORAGE_KEY, JSON.stringify(realAdmins))
      return realAdmins
    }
  } catch (err) {
    console.warn('Error fetching admin profiles:', err)
  }
  return getExpenseSpenders()
}

export function getExpenseSpenders(): ExpenseSpender[] {
  try {
    const raw = localStorage.getItem(SPENDERS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        // Discard any legacy mock items
        const valid = parsed.filter(
          (s) => !['usr-abhishek', 'usr-rajesh', 'usr-sanjay'].includes(s.id),
        )
        return valid
      }
    }
    return []
  } catch (err) {
    console.error('Failed to get expense spenders:', err)
    return []
  }
}

export function saveExpenseSpender(spender: ExpenseSpender): ExpenseSpender[] {
  const spenders = getExpenseSpenders()
  const index = spenders.findIndex((s) => s.id === spender.id)
  let updated: ExpenseSpender[]
  if (index >= 0) {
    updated = [...spenders]
    updated[index] = spender
  } else {
    updated = [...spenders, spender]
  }
  try {
    localStorage.setItem(SPENDERS_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save spender:', err)
  }
  return updated
}

/* ================== CATEGORIES CRUD ================== */

export function getExpenseCategories(): ExpenseCategory[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES))
      return DEFAULT_CATEGORIES
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return DEFAULT_CATEGORIES
  } catch (err) {
    console.error('Failed to get expense categories:', err)
    return DEFAULT_CATEGORIES
  }
}

export function saveExpenseCategory(
  category: Omit<ExpenseCategory, 'createdAt'> & { createdAt?: string },
): ExpenseCategory[] {
  const categories = getExpenseCategories()
  const now = new Date().toISOString()
  const index = categories.findIndex((c) => c.id === category.id)
  let updated: ExpenseCategory[]

  if (index >= 0) {
    updated = [...categories]
    updated[index] = {
      ...categories[index],
      ...category,
      createdAt: categories[index].createdAt || now,
    }
  } else {
    const newCategory: ExpenseCategory = {
      ...category,
      id: category.id || `cat-${Date.now()}`,
      createdAt: now,
    }
    updated = [...categories, newCategory]
  }

  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save category:', err)
  }
  return updated
}

export function deleteExpenseCategory(id: string): {
  success: boolean
  error?: string
  categories: ExpenseCategory[]
} {
  const expenses = getExpenses()
  const hasLinkedExpenses = expenses.some((e) => e.categoryId === id)
  if (hasLinkedExpenses) {
    return {
      success: false,
      error:
        'Cannot delete this category because there are active expenses linked to it. Please reassign or delete those expenses first.',
      categories: getExpenseCategories(),
    }
  }

  const categories = getExpenseCategories()
  const updated = categories.filter((c) => c.id !== id)
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to delete category:', err)
  }
  return { success: true, categories: updated }
}

/* ================== EXPENSES CRUD ================== */

/**
 * Loads user expenses from storage.
 * Absolutely NO fake or hardcoded expenses.
 * Starts with clean empty array [] if no expenses have been recorded yet.
 */
export function getExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      // Purge any fake/seed items from previous sessions (e.g. exp-1, exp-2, etc.)
      const userOnly = parsed.filter(
        (item: ExpenseRecord) =>
          !['exp-1', 'exp-2', 'exp-3', 'exp-4', 'exp-5', 'exp-6', 'exp-7', 'exp-8'].includes(
            item.id,
          ),
      )
      if (userOnly.length !== parsed.length) {
        localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(userOnly))
      }
      return userOnly
    }
    return []
  } catch (err) {
    console.error('Failed to get expenses:', err)
    return []
  }
}

export function saveExpense(
  expense: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): ExpenseRecord[] {
  const expenses = getExpenses()
  const now = new Date().toISOString()
  let updated: ExpenseRecord[]

  if (expense.id) {
    const index = expenses.findIndex((e) => e.id === expense.id)
    if (index >= 0) {
      updated = [...expenses]
      updated[index] = {
        ...expenses[index],
        ...expense,
        id: expense.id,
        updatedAt: now,
      }
    } else {
      updated = [
        {
          ...expense,
          id: expense.id,
          createdAt: now,
          updatedAt: now,
        },
        ...expenses,
      ]
    }
  } else {
    const newRecord: ExpenseRecord = {
      ...expense,
      id: `expense-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    updated = [newRecord, ...expenses]
  }

  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save expense:', err)
  }
  return updated
}

export function deleteExpense(id: string): ExpenseRecord[] {
  const expenses = getExpenses()
  const updated = expenses.filter((e) => e.id !== id)
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to delete expense:', err)
  }
  return updated
}

/* ================== ANALYTICS & HELPERS ================== */

export function filterExpenses(
  expenses: ExpenseRecord[],
  options: {
    from?: string
    to?: string
    categoryId?: string
    paymentMethod?: string
    spentById?: string
    searchQuery?: string
  },
): ExpenseRecord[] {
  return expenses.filter((item) => {
    if (options.from && dayjs(item.date).isBefore(dayjs(options.from), 'day')) return false
    if (options.to && dayjs(item.date).isAfter(dayjs(options.to), 'day')) return false
    if (options.categoryId && options.categoryId !== 'all' && item.categoryId !== options.categoryId)
      return false
    if (
      options.paymentMethod &&
      options.paymentMethod !== 'all' &&
      item.paymentMethod !== options.paymentMethod
    )
      return false
    if (options.spentById && options.spentById !== 'all' && item.spentById !== options.spentById)
      return false
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim()
      const titleMatch = item.title.toLowerCase().includes(q)
      const vendorMatch = item.vendor?.toLowerCase().includes(q)
      const notesMatch = item.notes?.toLowerCase().includes(q)
      const spentByMatch = item.spentByName?.toLowerCase().includes(q)
      if (!titleMatch && !vendorMatch && !notesMatch && !spentByMatch) return false
    }
    return true
  })
}

export function computeExpenseSummary(
  filteredExpenses: ExpenseRecord[],
  allExpenses: ExpenseRecord[],
  categories: ExpenseCategory[],
): ExpenseSummary {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const totalAmount = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  // Today's amount from all records
  const todayAmount = allExpenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  let cashTotal = 0
  let upiTotal = 0
  let cardTotal = 0
  let bankTotal = 0

  const catMap = new Map<string, number>()

  for (const item of filteredExpenses) {
    const amt = Number(item.amount) || 0
    if (item.paymentMethod === 'cash') cashTotal += amt
    else if (item.paymentMethod === 'upi') upiTotal += amt
    else if (item.paymentMethod === 'card') cardTotal += amt
    else if (item.paymentMethod === 'bank_transfer') bankTotal += amt

    catMap.set(item.categoryId, (catMap.get(item.categoryId) || 0) + amt)
  }

  let topCategory: ExpenseSummary['topCategory'] = null
  let maxCatAmount = 0
  for (const [catId, amt] of catMap.entries()) {
    if (amt > maxCatAmount) {
      maxCatAmount = amt
      const cat = categories.find((c) => c.id === catId)
      topCategory = {
        id: catId,
        name: cat?.name || 'Uncategorized',
        amount: amt,
        percentage: totalAmount > 0 ? Math.round((amt / totalAmount) * 100) : 0,
        color: cat?.color || '#94a3b8',
      }
    }
  }

  return {
    totalAmount,
    todayAmount,
    transactionCount: filteredExpenses.length,
    topCategory,
    cashTotal,
    upiTotal,
    cardTotal,
    bankTotal,
  }
}

export function computeCategoryBreakdown(
  filteredExpenses: ExpenseRecord[],
  categories: ExpenseCategory[],
): CategoryBreakdown[] {
  const totalAmount = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const map = new Map<string, { amount: number; count: number }>()

  for (const item of filteredExpenses) {
    const existing = map.get(item.categoryId) || { amount: 0, count: 0 }
    map.set(item.categoryId, {
      amount: existing.amount + (Number(item.amount) || 0),
      count: existing.count + 1,
    })
  }

  return categories
    .map((cat) => {
      const stats = map.get(cat.id) || { amount: 0, count: 0 }
      const percentage = totalAmount > 0 ? Math.round((stats.amount / totalAmount) * 100) : 0
      return {
        categoryId: cat.id,
        name: cat.name,
        color: cat.color,
        iconName: cat.iconName,
        amount: stats.amount,
        percentage,
        count: stats.count,
      }
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export function exportExpensesCsv(
  filteredExpenses: ExpenseRecord[],
  categories: ExpenseCategory[],
) {
  const catLookup = new Map(categories.map((c) => [c.id, c.name]))
  const rows = filteredExpenses.map((exp) => ({
    Date: exp.date,
    Title: exp.title,
    Category: catLookup.get(exp.categoryId) || 'Other',
    'Spent By (Super User)': exp.spentByName || '-',
    'Amount (INR)': exp.amount,
    'Payment Method': exp.paymentMethod.toUpperCase(),
    Vendor: exp.vendor || '-',
    Notes: exp.notes || '-',
  }))
  downloadCsv(rows, `kitchen-expenses-${dayjs().format('YYYY-MM-DD')}.csv`)
}
