export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer'

export interface ExpenseCategory {
  id: string
  name: string
  color: string
  iconName: string
  description?: string
  isDefault?: boolean
  createdAt: string
}

export interface ExpenseSpender {
  id: string
  name: string
  role?: string
  email?: string
  phone?: string
}

export interface ExpenseRecord {
  id: string
  title: string
  categoryId: string
  amount: number
  date: string // YYYY-MM-DD
  paymentMethod: PaymentMethod
  spentById?: string // ID of super user / family member who spent
  spentByName?: string // Name of super user / family member
  vendor?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ExpenseFilterPreset = 'all' | 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'year' | 'custom'

export interface ExpenseSummary {
  totalAmount: number
  todayAmount: number
  transactionCount: number
  topCategory: {
    id: string
    name: string
    amount: number
    percentage: number
    color: string
  } | null
  cashTotal: number
  upiTotal: number
  cardTotal: number
  bankTotal: number
}

export interface CategoryBreakdown {
  categoryId: string
  name: string
  color: string
  iconName: string
  amount: number
  percentage: number
  count: number
}
