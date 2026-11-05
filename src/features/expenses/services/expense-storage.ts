import dayjs from 'dayjs'
import { supabase } from '@/lib/supabase'
import type {
  ExpenseCategory,
  ExpenseRecord,
  ExpenseSummary,
  CategoryBreakdown,
  ExpenseSpender,
  ExpenseType,
  IncomeRecord,
  IncomeSummary,
  MemberFinancialSummary,
  FamilyFinancialSummary,
} from '../types'
import { downloadCsv } from '@/lib/csv-export'

const CATEGORIES_STORAGE_KEY = 'foodiq_kitchen_expense_categories'
const EXPENSES_STORAGE_KEY = 'foodiq_kitchen_expenses'
const SPENDERS_STORAGE_KEY = 'foodiq_kitchen_expense_spenders'
const INCOMES_STORAGE_KEY = 'foodiq_family_incomes'
const OPENING_BALANCES_STORAGE_KEY = 'foodiq_member_opening_balances'

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  // Kitchen Categories
  {
    id: 'cat-veggies',
    name: 'Veggies & Fruits',
    color: '#10b981', // emerald-500
    iconName: 'Carrot',
    description: 'Fresh vegetables, mandi runs, herbs, and fruits',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-groceries',
    name: 'Groceries & Staples',
    color: '#f59e0b', // amber-500
    iconName: 'ShoppingBag',
    description: 'Flour, rice, cooking oil, spices, pulses, and dry goods',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-petrol',
    name: 'Petrol & Fuel',
    color: '#ef4444', // red-500
    iconName: 'Fuel',
    description: 'Vehicle petrol for kitchen market runs and delivery transport',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-equipment',
    name: 'New Purchases & Equipment',
    color: '#3b82f6', // blue-500
    iconName: 'UtensilsCrossed',
    description: 'New utensils, pans, mixer, knives, and kitchen appliances',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-dairy',
    name: 'Dairy Products',
    color: '#06b6d4', // cyan-500
    iconName: 'Milk',
    description: 'Milk, paneer, curd, butter, and cheese',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-packaging',
    name: 'Packaging & Disposables',
    color: '#8b5cf6', // purple-500
    iconName: 'Package',
    description: 'Thali meal boxes, plastic containers, paper bags, tape',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-gas',
    name: 'Gas & Utilities',
    color: '#f97316', // orange-500
    iconName: 'Flame',
    description: 'Commercial LPG cylinders, water jars, electricity',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-repairs',
    name: 'Repairs & Maintenance',
    color: '#64748b', // slate-500
    iconName: 'Wrench',
    description: 'Burner service, deep chimney cleaning, plumbing, repairs',
    scope: 'kitchen',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  // Personal & Family Categories
  {
    id: 'cat-pers-food',
    name: 'Personal Food & Dining',
    color: '#f59e0b',
    iconName: 'Utensils',
    description: 'Dining out, cafes, snacks, personal food delivery',
    scope: 'personal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-pers-clothes',
    name: 'Clothes & Shopping',
    color: '#ec4899',
    iconName: 'Shirt',
    description: 'Clothing, footwear, tailoring, personal shopping',
    scope: 'personal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-pers-groceries',
    name: 'Family Groceries',
    color: '#10b981',
    iconName: 'Home',
    description: 'Home groceries, domestic kitchen food & household supplies',
    scope: 'personal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-pers-bills',
    name: 'Bills & Utilities',
    color: '#3b82f6',
    iconName: 'Zap',
    description: 'Home electricity bills, mobile recharges, Wi-Fi, rent',
    scope: 'personal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-pers-medical',
    name: 'Medical & Healthcare',
    color: '#ef4444',
    iconName: 'HeartPulse',
    description: 'Doctor consultations, medicines, pharmacy, tests',
    scope: 'personal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-pers-education',
    name: 'Kids & Education',
    color: '#8b5cf6',
    iconName: 'GraduationCap',
    description: 'School fees, books, tuition classes, stationery',
    scope: 'personal',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-pers-misc',
    name: 'Miscellaneous Personal',
    color: '#64748b',
    iconName: 'Sparkles',
    description: 'Personal gifts, entertainment, movie tickets, other individual spend',
    scope: 'personal',
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
        return parsed
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
      let hasChanges = false
      // Ensure all existing categories have scope
      const existing: ExpenseCategory[] = parsed.map((cat: ExpenseCategory) => {
        if (!cat.scope) {
          hasChanges = true
          return { ...cat, scope: 'kitchen' as const }
        }
        return cat
      })

      // Auto-seed missing default personal categories so users get them seamlessly
      const existingIds = new Set(existing.map((c) => c.id))
      const personalDefaults = DEFAULT_CATEGORIES.filter((c) => c.scope === 'personal')
      for (const defCat of personalDefaults) {
        if (!existingIds.has(defCat.id)) {
          existing.push(defCat)
          hasChanges = true
        }
      }

      if (hasChanges) {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(existing))
      }
      return existing
    }
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES))
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

  const categoryToSave: ExpenseCategory = {
    ...category,
    scope: category.scope || 'kitchen',
    createdAt: index >= 0 ? categories[index].createdAt || now : now,
    id: category.id || `cat-${Date.now()}`,
  }

  if (index >= 0) {
    updated = [...categories]
    updated[index] = categoryToSave
  } else {
    updated = [...categories, categoryToSave]
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
 * Automatically ensures expenseType is present ('kitchen' | 'personal').
 * Starts with clean empty array [] if no expenses have been recorded yet.
 */
export function getExpenses(): ExpenseRecord[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((item: ExpenseRecord) => ({
        ...item,
        expenseType: item.expenseType || 'kitchen',
      }))
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

  const itemToSave = {
    ...expense,
    expenseType: expense.expenseType || 'kitchen',
  }

  if (expense.id) {
    const index = expenses.findIndex((e) => e.id === expense.id)
    if (index >= 0) {
      updated = [...expenses]
      updated[index] = {
        ...expenses[index],
        ...itemToSave,
        id: expense.id,
        updatedAt: now,
      }
    } else {
      updated = [
        {
          ...itemToSave,
          id: expense.id,
          createdAt: now,
          updatedAt: now,
        },
        ...expenses,
      ]
    }
  } else {
    const newRecord: ExpenseRecord = {
      ...itemToSave,
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
    expenseType?: ExpenseType | 'all'
  },
): ExpenseRecord[] {
  return expenses.filter((item) => {
    // Expense Type Filter (kitchen vs personal vs all)
    if (options.expenseType && options.expenseType !== 'all') {
      const recType = item.expenseType || 'kitchen'
      if (recType !== options.expenseType) return false
    }

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
  _allExpenses: ExpenseRecord[],
  categories: ExpenseCategory[],
): ExpenseSummary {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const totalAmount = filteredExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  // Today's amount from filtered records
  const todayAmount = filteredExpenses
    .filter((e) => e.date === todayStr)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  let cashTotal = 0
  let upiTotal = 0
  let cardTotal = 0
  let bankTotal = 0

  let kitchenTotal = 0
  let personalTotal = 0
  let kitchenCount = 0
  let personalCount = 0

  const catMap = new Map<string, number>()

  for (const item of filteredExpenses) {
    const amt = Number(item.amount) || 0
    if (item.paymentMethod === 'cash') cashTotal += amt
    else if (item.paymentMethod === 'upi') upiTotal += amt
    else if (item.paymentMethod === 'card') cardTotal += amt
    else if (item.paymentMethod === 'bank_transfer') bankTotal += amt

    const recType = item.expenseType || 'kitchen'
    if (recType === 'personal') {
      personalTotal += amt
      personalCount += 1
    } else {
      kitchenTotal += amt
      kitchenCount += 1
    }

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
    kitchenTotal,
    personalTotal,
    kitchenCount,
    personalCount,
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
        scope: cat.scope,
      }
    })
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export function exportExpensesCsv(
  filteredExpenses: ExpenseRecord[],
  categories: ExpenseCategory[],
  filePrefix: string = 'expenses',
) {
  const catLookup = new Map(categories.map((c) => [c.id, c.name]))
  const headers = [
    'Date',
    'Type',
    'Title',
    'Category',
    'Spent By (Admin User)',
    'Amount (INR)',
    'Payment Method',
    'Vendor',
    'Notes',
  ]
  const rows = filteredExpenses.map((exp) => [
    exp.date,
    (exp.expenseType || 'kitchen') === 'personal' ? 'Personal' : 'Kitchen',
    exp.title,
    catLookup.get(exp.categoryId) || 'Other',
    exp.spentByName || '-',
    exp.amount,
    exp.paymentMethod.toUpperCase(),
    exp.vendor || '-',
    exp.notes || '-',
  ])
  downloadCsv(`${filePrefix}-${dayjs().format('YYYY-MM-DD')}.csv`, headers, rows)
}

/* ================== INCOME MANAGEMENT CRUD ================== */

export const DEFAULT_INCOME_CATEGORIES: { id: string; name: string; color: string }[] = [
  { id: 'salary', name: 'Salary / Wages', color: '#10b981' },
  { id: 'business', name: 'Business / Shop Profit', color: '#3b82f6' },
  { id: 'freelance', name: 'Freelance & Projects', color: '#8b5cf6' },
  { id: 'investment', name: 'Investments / Returns', color: '#f59e0b' },
  { id: 'rental', name: 'Rental Income', color: '#06b6d4' },
  { id: 'allowance', name: 'Pocket Money / Allowance', color: '#ec4899' },
  { id: 'gift', name: 'Bonus & Gifts', color: '#f97316' },
  { id: 'other', name: 'Other Income', color: '#64748b' },
]

export function getIncomes(): IncomeRecord[] {
  try {
    const raw = localStorage.getItem(INCOMES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (err) {
    console.error('Failed to get incomes:', err)
    return []
  }
}

export function saveIncome(
  income: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): IncomeRecord[] {
  const incomes = getIncomes()
  const now = new Date().toISOString()
  let updated: IncomeRecord[]

  if (income.id) {
    const index = incomes.findIndex((i) => i.id === income.id)
    if (index >= 0) {
      updated = [...incomes]
      updated[index] = {
        ...incomes[index],
        ...income,
        id: income.id,
        updatedAt: now,
      }
    } else {
      updated = [
        {
          ...income,
          id: income.id,
          createdAt: now,
          updatedAt: now,
        },
        ...incomes,
      ]
    }
  } else {
    const newRecord: IncomeRecord = {
      ...income,
      id: `income-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    }
    updated = [newRecord, ...incomes]
  }

  try {
    localStorage.setItem(INCOMES_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save income:', err)
  }
  return updated
}

export function deleteIncome(id: string): IncomeRecord[] {
  const incomes = getIncomes()
  const updated = incomes.filter((i) => i.id !== id)
  try {
    localStorage.setItem(INCOMES_STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to delete income:', err)
  }
  return updated
}

export function filterIncomes(
  incomes: IncomeRecord[],
  options: {
    from?: string
    to?: string
    memberId?: string
    category?: string
    paymentMethod?: string
    searchQuery?: string
  },
): IncomeRecord[] {
  return incomes.filter((item) => {
    if (options.from && dayjs(item.date).isBefore(dayjs(options.from), 'day')) return false
    if (options.to && dayjs(item.date).isAfter(dayjs(options.to), 'day')) return false
    if (options.memberId && options.memberId !== 'all' && item.memberId !== options.memberId)
      return false
    if (options.category && options.category !== 'all' && item.category !== options.category)
      return false
    if (
      options.paymentMethod &&
      options.paymentMethod !== 'all' &&
      item.paymentMethod !== options.paymentMethod
    )
      return false
    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim()
      const titleMatch = item.title.toLowerCase().includes(q)
      const memberMatch = item.memberName.toLowerCase().includes(q)
      const notesMatch = item.notes?.toLowerCase().includes(q)
      if (!titleMatch && !memberMatch && !notesMatch) return false
    }
    return true
  })
}

/* ================== MEMBER OPENING BALANCES ================== */

export function getMemberOpeningBalances(): Record<string, number> {
  try {
    const raw = localStorage.getItem(OPENING_BALANCES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed
    }
    return {}
  } catch (err) {
    console.error('Failed to get opening balances:', err)
    return {}
  }
}

export function saveMemberOpeningBalances(
  balances: Record<string, number>,
): Record<string, number> {
  try {
    localStorage.setItem(OPENING_BALANCES_STORAGE_KEY, JSON.stringify(balances))
  } catch (err) {
    console.error('Failed to save opening balances:', err)
  }
  return balances
}

/* ================== FINANCIAL BALANCE CALCULATIONS ================== */

export function computeFamilyFinancialSummary(
  spenders: ExpenseSpender[],
  expenses: ExpenseRecord[],
  incomes: IncomeRecord[],
  openingBalances: Record<string, number>,
): FamilyFinancialSummary {
  let totalOpeningBalance = 0
  let totalIncome = 0
  let totalPersonalExpense = 0
  let totalKitchenExpense = 0

  const memberSummaries: MemberFinancialSummary[] = spenders.map((member) => {
    const openingBalance = Number(openingBalances[member.id]) || 0
    totalOpeningBalance += openingBalance

    const memberIncomes = incomes.filter((i) => i.memberId === member.id)
    const memIncome = memberIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
    totalIncome += memIncome

    const memberExpenses = expenses.filter((e) => e.spentById === member.id)
    const memPersonalExpense = memberExpenses
      .filter((e) => (e.expenseType || 'kitchen') === 'personal')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    totalPersonalExpense += memPersonalExpense

    const memKitchenExpense = memberExpenses
      .filter((e) => (e.expenseType || 'kitchen') === 'kitchen')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    totalKitchenExpense += memKitchenExpense

    const memTotalExpense = memPersonalExpense + memKitchenExpense
    const currentBalance = openingBalance + memIncome - memTotalExpense

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      openingBalance,
      totalIncome: memIncome,
      totalPersonalExpense: memPersonalExpense,
      totalKitchenExpense: memKitchenExpense,
      totalExpense: memTotalExpense,
      currentBalance,
    }
  })

  // Sort members by highest current balance descending
  memberSummaries.sort((a, b) => b.currentBalance - a.currentBalance)

  const totalExpense = totalPersonalExpense + totalKitchenExpense
  const netFamilyBalance = totalOpeningBalance + totalIncome - totalExpense

  return {
    totalOpeningBalance,
    totalIncome,
    totalPersonalExpense,
    totalKitchenExpense,
    totalExpense,
    netFamilyBalance,
    members: memberSummaries,
  }
}

export function computeIncomeSummary(
  filteredIncomes: IncomeRecord[],
  _allIncomes: IncomeRecord[],
): IncomeSummary {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const totalAmount = filteredIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const todayAmount = filteredIncomes
    .filter((i) => i.date === todayStr)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  let cashTotal = 0
  let upiTotal = 0
  let cardTotal = 0
  let bankTotal = 0

  const earnerMap = new Map<string, { name: string; amount: number }>()

  for (const item of filteredIncomes) {
    const amt = Number(item.amount) || 0
    if (item.paymentMethod === 'cash') cashTotal += amt
    else if (item.paymentMethod === 'upi') upiTotal += amt
    else if (item.paymentMethod === 'card') cardTotal += amt
    else if (item.paymentMethod === 'bank_transfer') bankTotal += amt

    const prev = earnerMap.get(item.memberId) || { name: item.memberName, amount: 0 }
    earnerMap.set(item.memberId, {
      name: item.memberName,
      amount: prev.amount + amt,
    })
  }

  let topEarner: IncomeSummary['topEarner'] = null
  let maxEarned = 0
  for (const [memId, data] of earnerMap.entries()) {
    if (data.amount > maxEarned) {
      maxEarned = data.amount
      topEarner = {
        memberId: memId,
        memberName: data.name,
        amount: data.amount,
        percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
      }
    }
  }

  return {
    totalAmount,
    todayAmount,
    transactionCount: filteredIncomes.length,
    topEarner,
    cashTotal,
    upiTotal,
    cardTotal,
    bankTotal,
  }
}

export function exportIncomesCsv(filteredIncomes: IncomeRecord[]) {
  const headers = [
    'Date',
    'Title / Source',
    'Earned By (Member)',
    'Category',
    'Amount (INR)',
    'Payment Method',
    'Notes',
  ]
  const rows = filteredIncomes.map((inc) => [
    inc.date,
    inc.title,
    inc.memberName || '-',
    inc.category.toUpperCase(),
    inc.amount,
    inc.paymentMethod.toUpperCase(),
    inc.notes || '-',
  ])
  downloadCsv(`family-income-${dayjs().format('YYYY-MM-DD')}.csv`, headers, rows)
}


