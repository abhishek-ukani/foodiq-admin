export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer'

export type ExpenseType = 'kitchen' | 'personal'
export type ExpenseCategoryScope = 'kitchen' | 'personal' | 'both'
export type ExpenseTabScope = 'kitchen' | 'personal' | 'income' | 'balances' | 'combined'

export type IncomeCategory =
  | 'salary'
  | 'business'
  | 'freelance'
  | 'investment'
  | 'rental'
  | 'allowance'
  | 'gift'
  | 'other'

export interface IncomeRecord {
  id: string
  title: string
  amount: number
  date: string // YYYY-MM-DD
  memberId: string // Admin user / family member ID
  memberName: string
  category: IncomeCategory | string
  paymentMethod: PaymentMethod
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MemberOpeningBalance {
  memberId: string
  memberName?: string
  openingBalance: number
  notes?: string
  updatedAt: string
}

export interface MemberFinancialSummary {
  memberId: string
  memberName: string
  role?: string
  openingBalance: number
  totalIncome: number
  totalPersonalExpense: number
  totalKitchenExpense: number
  totalExpense: number
  currentBalance: number // openingBalance + totalIncome - totalExpense
}

export interface FamilyFinancialSummary {
  totalOpeningBalance: number
  totalIncome: number
  totalPersonalExpense: number
  totalKitchenExpense: number
  totalExpense: number
  netFamilyBalance: number // totalOpeningBalance + totalIncome - totalExpense
  members: MemberFinancialSummary[]
}

export interface IncomeSummary {
  totalAmount: number
  todayAmount: number
  transactionCount: number
  topEarner: {
    memberId: string
    memberName: string
    amount: number
    percentage: number
  } | null
  cashTotal: number
  upiTotal: number
  cardTotal: number
  bankTotal: number
}

export interface ExpenseCategory {
  id: string
  name: string
  color: string
  iconName: string
  description?: string
  isDefault?: boolean
  scope?: ExpenseCategoryScope // 'kitchen' | 'personal' | 'both'
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
  expenseType?: ExpenseType // 'kitchen' | 'personal', defaults to 'kitchen'
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
  // Reference tracking metrics for combined overview
  kitchenTotal: number
  personalTotal: number
  kitchenCount: number
  personalCount: number
}

export interface CategoryBreakdown {
  categoryId: string
  name: string
  color: string
  iconName: string
  amount: number
  percentage: number
  count: number
  scope?: ExpenseCategoryScope
}
