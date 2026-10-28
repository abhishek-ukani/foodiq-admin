import { useState, useMemo, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Plus,
  Download,
  FolderTree,
  Search,
  QrCode,
  Banknote,
  RotateCcw,
  Edit2,
  Trash2,
  UserCheck,
  ChefHat,
  User,
  PieChart as PieChartIcon,
  TrendingUp,
  Landmark,
  Users,
  ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CURRENCY_SYMBOL } from '@/constants'
import { CategoryIcon } from './category-icon'
import { CategoryBreakdownChart } from './category-breakdown-chart'
import { ExpensesMobileList } from './expenses-mobile-list'
import { ExpenseFormDialog } from './expense-form-dialog'
import { CategoryManagerDialog } from './category-manager-dialog'
import { IncomeFormDialog } from './income-form-dialog'
import { OpeningBalancesDialog } from './opening-balances-dialog'
import { MemberBalancesView } from './member-balances-view'
import { IncomesMobileList } from './incomes-mobile-list'
import {
  getExpenses,
  getExpenseCategories,
  getExpenseSpenders,
  fetchAdminProfiles,
  saveExpense,
  deleteExpense,
  saveExpenseCategory,
  deleteExpenseCategory,
  filterExpenses,
  computeExpenseSummary,
  computeCategoryBreakdown,
  exportExpensesCsv,
  getIncomes,
  saveIncome,
  deleteIncome,
  filterIncomes,
  computeIncomeSummary,
  exportIncomesCsv,
  getMemberOpeningBalances,
  saveMemberOpeningBalances,
  computeFamilyFinancialSummary,
  DEFAULT_INCOME_CATEGORIES,
} from '../services/expense-storage'
import type {
  ExpenseRecord,
  ExpenseCategory,
  ExpenseFilterPreset,
  ExpenseSpender,
  ExpenseTabScope,
  IncomeRecord,
} from '../types'
import toast from 'react-hot-toast'

const DATE_PRESETS: { key: ExpenseFilterPreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 Days' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
]

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => getExpenses())
  const [categories, setCategories] = useState<ExpenseCategory[]>(() => getExpenseCategories())
  const [spenders, setSpenders] = useState<ExpenseSpender[]>(() => getExpenseSpenders())
  const [incomes, setIncomes] = useState<IncomeRecord[]>(() => getIncomes())
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>(() =>
    getMemberOpeningBalances(),
  )

  // Active Scope Tab: 'kitchen' | 'personal' | 'income' | 'balances' | 'combined'
  const [activeTab, setActiveTab] = useState<ExpenseTabScope>('balances')

  // Filters
  const [preset, setPreset] = useState<ExpenseFilterPreset>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<string>('all')
  const [selectedSpender, setSelectedSpender] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)
  const [incomeFormOpen, setIncomeFormOpen] = useState(false)
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null)
  const [openingBalancesDialogOpen, setOpeningBalancesDialogOpen] = useState(false)
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<string | undefined>(
    undefined,
  )

  // Sync real-time admin profiles from Supabase (the 5 family members who are admins)
  useEffect(() => {
    let isMounted = true
    fetchAdminProfiles().then((admins) => {
      if (isMounted && admins && admins.length > 0) {
        setSpenders(admins)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Calculate Date Boundaries
  const dateRange = useMemo<{ from?: string; to?: string }>(() => {
    const today = dayjs()
    switch (preset) {
      case 'today':
        return {
          from: today.format('YYYY-MM-DD'),
          to: today.format('YYYY-MM-DD'),
        }
      case 'yesterday': {
        const y = today.subtract(1, 'day').format('YYYY-MM-DD')
        return { from: y, to: y }
      }
      case '7d':
        return {
          from: today.subtract(6, 'day').format('YYYY-MM-DD'),
          to: today.format('YYYY-MM-DD'),
        }
      case 'month':
        return {
          from: today.startOf('month').format('YYYY-MM-DD'),
          to: today.format('YYYY-MM-DD'),
        }
      case 'custom':
        return {
          from: customFrom || undefined,
          to: customTo || undefined,
        }
      case 'all':
      default:
        return {}
    }
  }, [preset, customFrom, customTo])

  // Family Financial Summary (Outstanding balances per member & total family treasury)
  const familySummary = useMemo(() => {
    return computeFamilyFinancialSummary(spenders, expenses, incomes, openingBalances)
  }, [spenders, expenses, incomes, openingBalances])

  // Relevant Expense Categories based on active tab
  const relevantCategories = useMemo(() => {
    if (activeTab === 'kitchen') {
      return categories.filter((c) => !c.scope || c.scope === 'both' || c.scope === 'kitchen')
    }
    if (activeTab === 'personal') {
      return categories.filter((c) => c.scope === 'both' || c.scope === 'personal')
    }
    return categories
  }, [categories, activeTab])

  // Filtered Expenses strictly adhering to the selected tab scope
  const filteredExpenses = useMemo(() => {
    return filterExpenses(expenses, {
      from: dateRange.from,
      to: dateRange.to,
      categoryId: selectedCategory,
      paymentMethod: selectedPayment,
      spentById: selectedSpender,
      searchQuery,
      expenseType: activeTab === 'combined' ? 'all' : activeTab === 'kitchen' ? 'kitchen' : 'personal',
    })
  }, [expenses, dateRange, selectedCategory, selectedPayment, selectedSpender, searchQuery, activeTab])

  // Filtered Incomes for income tab
  const filteredIncomes = useMemo(() => {
    return filterIncomes(incomes, {
      from: dateRange.from,
      to: dateRange.to,
      memberId: selectedSpender,
      category: selectedIncomeCategory,
      paymentMethod: selectedPayment,
      searchQuery,
    })
  }, [incomes, dateRange, selectedSpender, selectedIncomeCategory, selectedPayment, searchQuery])

  // Summary Metrics strictly calculated on filtered expenses
  const summary = useMemo(() => {
    return computeExpenseSummary(filteredExpenses, expenses, categories)
  }, [filteredExpenses, expenses, categories])

  // Category Breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    return computeCategoryBreakdown(filteredExpenses, categories)
  }, [filteredExpenses, categories])

  // Income Summary Metrics
  const incomeSummary = useMemo(() => {
    return computeIncomeSummary(filteredIncomes, incomes)
  }, [filteredIncomes, incomes])

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]))
  }, [categories])

  // Tab Stats for Badge Counts & Totals in active date range
  const tabStats = useMemo(() => {
    const inRangeExpenses = expenses.filter((item) => {
      if (dateRange.from && dayjs(item.date).isBefore(dayjs(dateRange.from), 'day')) return false
      if (dateRange.to && dayjs(item.date).isAfter(dayjs(dateRange.to), 'day')) return false
      return true
    })
    const inRangeIncomes = incomes.filter((item) => {
      if (dateRange.from && dayjs(item.date).isBefore(dayjs(dateRange.from), 'day')) return false
      if (dateRange.to && dayjs(item.date).isAfter(dayjs(dateRange.to), 'day')) return false
      return true
    })

    const kitchen = inRangeExpenses.filter((e) => (e.expenseType || 'kitchen') === 'kitchen')
    const personal = inRangeExpenses.filter((e) => (e.expenseType || 'kitchen') === 'personal')

    const kitchenTotal = kitchen.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const personalTotal = personal.reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    const incomeTotal = inRangeIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)

    return {
      kitchenCount: kitchen.length,
      personalCount: personal.length,
      incomeCount: inRangeIncomes.length,
      totalExpenseCount: inRangeExpenses.length,
      kitchenTotal,
      personalTotal,
      incomeTotal,
    }
  }, [expenses, incomes, dateRange])

  // Tab switch handler
  const handleTabChange = (newTab: ExpenseTabScope) => {
    setActiveTab(newTab)
    // If selected category does not exist in new tab, reset to 'all'
    if (selectedCategory !== 'all') {
      const isStillValid = categories.some((c) => {
        if (c.id !== selectedCategory) return false
        if (newTab === 'combined') return true
        if (newTab === 'kitchen') return !c.scope || c.scope === 'both' || c.scope === 'kitchen'
        if (newTab === 'personal') return c.scope === 'both' || c.scope === 'personal'
        return true
      })
      if (!isStillValid) {
        setSelectedCategory('all')
      }
    }
  }

  // Expense Handlers
  const handleSaveExpense = (
    data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => {
    const updated = saveExpense(data)
    setExpenses(updated)
  }

  const handleDeleteExpense = (id: string) => {
    if (confirm('Are you sure you want to delete this expense record?')) {
      const updated = deleteExpense(id)
      setExpenses(updated)
      toast.success('Expense deleted')
    }
  }

  const handleOpenAddExpense = (memberId?: string) => {
    setEditingExpense(null)
    setSelectedMemberForAction(memberId)
    setFormOpen(true)
  }

  const handleOpenEditExpense = (expense: ExpenseRecord) => {
    setEditingExpense(expense)
    setSelectedMemberForAction(expense.spentById)
    setFormOpen(true)
  }

  // Income Handlers
  const handleSaveIncome = (
    data: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  ) => {
    const updated = saveIncome(data)
    setIncomes(updated)
  }

  const handleDeleteIncome = (id: string) => {
    if (confirm('Are you sure you want to delete this income record?')) {
      const updated = deleteIncome(id)
      setIncomes(updated)
      toast.success('Income deleted')
    }
  }

  const handleOpenAddIncome = (memberId?: string) => {
    setEditingIncome(null)
    setSelectedMemberForAction(memberId)
    setIncomeFormOpen(true)
  }

  const handleOpenEditIncome = (income: IncomeRecord) => {
    setEditingIncome(income)
    setSelectedMemberForAction(income.memberId)
    setIncomeFormOpen(true)
  }

  // Opening Balances Handler
  const handleSaveOpeningBalances = (newBalances: Record<string, number>) => {
    const updated = saveMemberOpeningBalances(newBalances)
    setOpeningBalances(updated)
  }

  // Category Handlers
  const handleSaveCategory = (
    cat: Omit<ExpenseCategory, 'createdAt'> & { createdAt?: string },
  ) => {
    const updated = saveExpenseCategory(cat)
    setCategories(updated)
  }

  const handleDeleteCategory = (id: string) => {
    const res = deleteExpenseCategory(id)
    if (res.success) {
      setCategories(res.categories)
    }
    return res
  }

  const handleResetFilters = () => {
    setPreset('month')
    setSelectedCategory('all')
    setSelectedIncomeCategory('all')
    setSelectedPayment('all')
    setSelectedSpender('all')
    setSearchQuery('')
    setCustomFrom('')
    setCustomTo('')
  }

  const hasActiveFilters =
    preset !== 'month' ||
    selectedCategory !== 'all' ||
    selectedIncomeCategory !== 'all' ||
    selectedPayment !== 'all' ||
    selectedSpender !== 'all' ||
    Boolean(searchQuery.trim())

  const handleExport = () => {
    if (activeTab === 'income') {
      exportIncomesCsv(filteredIncomes)
    } else {
      const prefix =
        activeTab === 'kitchen'
          ? 'kitchen-expenses'
          : activeTab === 'personal'
            ? 'personal-expenses'
            : 'combined-expenses'
      exportExpensesCsv(filteredExpenses, categories, prefix)
    }
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
              {activeTab === 'balances' && 'Member & Family Balances'}
              {activeTab === 'income' && 'Family Income Streams'}
              {activeTab === 'kitchen' && 'Kitchen Expenses'}
              {activeTab === 'personal' && 'Personal & Family Expenses'}
              {activeTab === 'combined' && 'Overall Cash Outflow'}
            </h1>
            <Badge
              variant="outline"
              className={`text-xs capitalize font-semibold ${
                activeTab === 'balances'
                  ? 'border-emerald-300 text-emerald-800 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : activeTab === 'income'
                    ? 'border-emerald-300 text-emerald-800 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    : activeTab === 'kitchen'
                      ? 'border-primary/30 text-primary bg-primary/10'
                      : activeTab === 'personal'
                        ? 'border-purple-300 text-purple-700 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300'
                        : 'border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
              }`}
            >
              {activeTab === 'balances' && 'Treasury & Wallets'}
              {activeTab === 'income' && 'Inflow'}
              {activeTab === 'kitchen' && 'Kitchen Only'}
              {activeTab === 'personal' && 'Personal Only'}
              {activeTab === 'combined' && 'Reference Tracking'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {activeTab === 'balances' &&
              `Current outstanding balance per family member and consolidated household treasury (${spenders.length} admin members).`}
            {activeTab === 'income' &&
              'Track individual earnings, salary payouts, business profit, and returns per family member.'}
            {activeTab === 'kitchen' &&
              'Track commercial kitchen groceries, mandi ingredients, fuel, utilities, and daily operations.'}
            {activeTab === 'personal' &&
              'Manage family personal expenses (food, clothing, household groceries, medical, and individual spend). Excluded from kitchen calculations.'}
            {activeTab === 'combined' &&
              'Comprehensive reference overview showing combined financial outflows across business kitchen and personal family spend.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab !== 'balances' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="min-h-[44px] gap-1.5 shadow-2xs"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Export</span> CSV
            </Button>
          )}

          {(activeTab === 'kitchen' || activeTab === 'personal' || activeTab === 'combined') && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCategoryManagerOpen(true)}
              className="min-h-[44px] gap-1.5 shadow-2xs"
            >
              <FolderTree className="size-4" />
              Categories
            </Button>
          )}

          {activeTab === 'balances' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpeningBalancesDialogOpen(true)}
              className="min-h-[44px] gap-1.5 shadow-2xs font-semibold"
            >
              <Landmark className="size-4 text-primary" />
              Opening Balances
            </Button>
          )}

          {activeTab === 'income' ? (
            <Button
              type="button"
              onClick={() => handleOpenAddIncome()}
              size="sm"
              className="min-h-[44px] gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-xs"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>Record Income</span>
            </Button>
          ) : activeTab === 'balances' ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => handleOpenAddIncome()}
                size="sm"
                className="min-h-[44px] gap-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white shadow-xs"
              >
                <Plus className="size-4 stroke-[3]" />
                <span>Add Income</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleOpenAddExpense()}
                size="sm"
                className="min-h-[44px] gap-1.5 bg-primary font-semibold text-primary-foreground shadow-xs"
              >
                <Plus className="size-4 stroke-[3]" />
                <span>Log Expense</span>
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => handleOpenAddExpense()}
              size="sm"
              className="min-h-[44px] gap-1.5 bg-primary font-semibold text-primary-foreground shadow-xs"
            >
              <Plus className="size-4 stroke-[3]" />
              <span>
                {activeTab === 'personal'
                  ? 'Log Personal Expense'
                  : activeTab === 'kitchen'
                    ? 'Log Kitchen Expense'
                    : 'Log Expense'}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top-Level Tab Switcher: 5 Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-muted/60 border shadow-2xs">
        {/* Tab 1: Member Balances */}
        <button
          type="button"
          onClick={() => handleTabChange('balances')}
          className={`flex min-h-[48px] items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'balances'
              ? 'bg-card text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Users className="size-4 shrink-0 text-emerald-600" />
            <span className="truncate">Member Balances</span>
          </div>
          <Badge
            variant={activeTab === 'balances' ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
          >
            {spenders.length}
          </Badge>
        </button>

        {/* Tab 2: Income */}
        <button
          type="button"
          onClick={() => handleTabChange('income')}
          className={`flex min-h-[48px] items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'income'
              ? 'bg-card text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <ArrowUpRight className="size-4 shrink-0 text-emerald-600" />
            <span className="truncate">Income</span>
          </div>
          <Badge
            variant={activeTab === 'income' ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
          >
            {tabStats.incomeCount}
          </Badge>
        </button>

        {/* Tab 3: Personal & Family */}
        <button
          type="button"
          onClick={() => handleTabChange('personal')}
          className={`flex min-h-[48px] items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'personal'
              ? 'bg-card text-purple-600 dark:text-purple-400 shadow-xs ring-1 ring-purple-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="size-4 shrink-0 text-purple-600" />
            <span className="truncate">Personal Spend</span>
          </div>
          <Badge
            variant={activeTab === 'personal' ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
          >
            {tabStats.personalCount}
          </Badge>
        </button>

        {/* Tab 4: Kitchen Expenses */}
        <button
          type="button"
          onClick={() => handleTabChange('kitchen')}
          className={`flex min-h-[48px] items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'kitchen'
              ? 'bg-card text-primary shadow-xs ring-1 ring-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <ChefHat className="size-4 shrink-0 text-primary" />
            <span className="truncate">Kitchen Spend</span>
          </div>
          <Badge
            variant={activeTab === 'kitchen' ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
          >
            {tabStats.kitchenCount}
          </Badge>
        </button>

        {/* Tab 5: Combined Overview */}
        <button
          type="button"
          onClick={() => handleTabChange('combined')}
          className={`flex min-h-[48px] items-center justify-between gap-1.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold transition-all col-span-2 sm:col-span-1 ${
            activeTab === 'combined'
              ? 'bg-card text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-blue-500/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <PieChartIcon className="size-4 shrink-0 text-blue-600" />
            <span className="truncate">All Outflow</span>
          </div>
          <Badge
            variant={activeTab === 'combined' ? 'default' : 'secondary'}
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
          >
            {tabStats.totalExpenseCount}
          </Badge>
        </button>
      </div>

      {/* 3. If Active Tab is 'balances', render dedicated MemberBalancesView */}
      {activeTab === 'balances' && (
        <MemberBalancesView
          summary={familySummary}
          onOpenSetBalances={() => setOpeningBalancesDialogOpen(true)}
          onAddIncomeForMember={(memId) => handleOpenAddIncome(memId)}
          onAddExpenseForMember={(memId) => handleOpenAddExpense(memId)}
        />
      )}

      {/* 4. If Active Tab is 'income', render Income Analytics and Table */}
      {activeTab === 'income' && (
        <div className="space-y-6">
          {/* Date Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {DATE_PRESETS.map((p) => {
              const isActive = preset === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Custom Date Inputs if 'custom' selected */}
          {preset === 'custom' && (
            <Card className="p-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">From:</span>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-10 text-xs w-36"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">To:</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-10 text-xs w-36"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Income KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Income Inflow
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  +{CURRENCY_SYMBOL}
                  {incomeSummary.totalAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {incomeSummary.transactionCount} {incomeSummary.transactionCount === 1 ? 'deposit' : 'deposits'} in period
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Today's Income
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  +{CURRENCY_SYMBOL}
                  {incomeSummary.todayAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Logged for today</p>
              </CardContent>
            </Card>

            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                  Top Earner / Contributor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                {incomeSummary.topEarner ? (
                  <div>
                    <div className="text-base sm:text-lg font-bold tracking-tight truncate text-foreground">
                      {incomeSummary.topEarner.memberName}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {CURRENCY_SYMBOL}
                      {incomeSummary.topEarner.amount.toLocaleString('en-IN')} ({incomeSummary.topEarner.percentage}%)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-base sm:text-lg font-bold text-muted-foreground">None</div>
                    <p className="text-[11px] text-muted-foreground mt-1">No income in period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Deposit Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-sm font-semibold flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    Bank / Net:
                  </span>
                  <span>
                    {CURRENCY_SYMBOL}
                    {incomeSummary.bankTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-sm font-semibold flex items-center justify-between mt-1 text-foreground">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    Cash / UPI:
                  </span>
                  <span>
                    {CURRENCY_SYMBOL}
                    {(incomeSummary.cashTotal + incomeSummary.upiTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Income Search, Filter Bar and Table */}
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">Income Records</CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {filteredIncomes.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search source, member..."
                      className="pl-9 h-10 text-xs"
                    />
                  </div>

                  {/* Member Dropdown */}
                  <select
                    value={selectedSpender}
                    onChange={(e) => setSelectedSpender(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[40px]"
                  >
                    <option value="all">All Members</option>
                    {spenders.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Income Category Dropdown */}
                  <select
                    value={selectedIncomeCategory}
                    onChange={(e) => setSelectedIncomeCategory(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[40px]"
                  >
                    <option value="all">All Sources</option>
                    {DEFAULT_INCOME_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {/* Payment Method */}
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px] sm:min-h-[40px]"
                  >
                    <option value="all">All Modes</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card / Cheque</option>
                  </select>

                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="min-h-[44px] sm:min-h-[40px] text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <RotateCcw className="size-3.5" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {/* Mobile View */}
              <div className="lg:hidden">
                <IncomesMobileList
                  incomes={filteredIncomes}
                  onEdit={handleOpenEditIncome}
                  onDelete={handleDeleteIncome}
                />
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                {filteredIncomes.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <p className="font-semibold text-foreground">No income records found</p>
                    <p className="text-xs mt-1">Record a salary, profit, or dividend.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        <TableHead className="w-40">Category</TableHead>
                        <TableHead>Source / Description</TableHead>
                        <TableHead className="w-36">Earned By</TableHead>
                        <TableHead className="w-28">Deposit Mode</TableHead>
                        <TableHead className="w-32 text-right">Amount</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIncomes.map((inc) => (
                        <TableRow key={inc.id}>
                          <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {dayjs(inc.date).format('DD MMM YYYY')}
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 capitalize">
                              <TrendingUp className="size-3" />
                              <span>{inc.category.replace('_', ' ')}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm text-foreground">
                              {inc.title}
                            </div>
                            {inc.notes && (
                              <div className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                                {inc.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {inc.memberName ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap border border-emerald-200 dark:border-emerald-800">
                                <UserCheck className="size-3" />
                                <span>{inc.memberName}</span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px] capitalize">
                              {inc.paymentMethod.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            +{CURRENCY_SYMBOL}
                            {Number(inc.amount).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditIncome(inc)}
                                className="size-8"
                                aria-label={`Edit ${inc.title}`}
                              >
                                <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteIncome(inc.id)}
                                className="size-8"
                                aria-label={`Delete ${inc.title}`}
                              >
                                <Trash2 className="size-3.5 text-destructive hover:text-destructive/80" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. If Active Tab is 'kitchen' | 'personal' | 'combined', render Expense Views */}
      {(activeTab === 'kitchen' || activeTab === 'personal' || activeTab === 'combined') && (
        <div className="space-y-6">
          {/* Date Presets Bar (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {DATE_PRESETS.map((p) => {
              const isActive = preset === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPreset(p.key)}
                  className={`min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              )
            })}
          </div>

          {/* Custom Date Inputs if 'custom' selected */}
          {preset === 'custom' && (
            <Card className="p-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">From:</span>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-10 text-xs w-36"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">To:</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-10 text-xs w-36"
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Combined Split Comparison Card (Only visible in 'combined' reference tracking tab) */}
          {activeTab === 'combined' && (
            <Card className="shadow-2xs overflow-hidden border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-card to-card">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <TrendingUp className="size-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        Cash Outflow Distribution: Kitchen vs Personal
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Kitchen costs remain isolated from your personal household spending.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                      Total Combined Outflow
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {CURRENCY_SYMBOL}
                      {summary.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-2 space-y-3">
                {/* Split Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Kitchen Share */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <ChefHat className="size-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">Kitchen Expenses</span>
                        <p className="text-[11px] text-muted-foreground">
                          {summary.kitchenCount} {summary.kitchenCount === 1 ? 'transaction' : 'transactions'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary block leading-tight">
                        {CURRENCY_SYMBOL}
                        {summary.kitchenTotal.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {summary.totalAmount > 0
                          ? `${Math.round((summary.kitchenTotal / summary.totalAmount) * 100)}% of total`
                          : '0%'}
                      </span>
                    </div>
                  </div>

                  {/* Personal Share */}
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-purple-600 text-white">
                        <User className="size-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground">Personal & Family</span>
                        <p className="text-[11px] text-muted-foreground">
                          {summary.personalCount} {summary.personalCount === 1 ? 'transaction' : 'transactions'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400 block leading-tight">
                        {CURRENCY_SYMBOL}
                        {summary.personalTotal.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {summary.totalAmount > 0
                          ? `${Math.round((summary.personalTotal / summary.totalAmount) * 100)}% of total`
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proportion Bar */}
                {summary.totalAmount > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted flex">
                      <div
                        className="bg-primary transition-all duration-500 h-full"
                        style={{
                          width: `${(summary.kitchenTotal / summary.totalAmount) * 100}%`,
                        }}
                        title={`Kitchen: ${CURRENCY_SYMBOL}${summary.kitchenTotal.toLocaleString('en-IN')}`}
                      />
                      <div
                        className="bg-purple-500 transition-all duration-500 h-full"
                        style={{
                          width: `${(summary.personalTotal / summary.totalAmount) * 100}%`,
                        }}
                        title={`Personal: ${CURRENCY_SYMBOL}${summary.personalTotal.toLocaleString('en-IN')}`}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1 text-primary">
                        <span className="size-2 rounded-full bg-primary inline-block" />
                        Kitchen Outflow ({Math.round((summary.kitchenTotal / summary.totalAmount) * 100)}%)
                      </span>
                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                        <span className="size-2 rounded-full bg-purple-500 inline-block" />
                        Personal Outflow ({Math.round((summary.personalTotal / summary.totalAmount) * 100)}%)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Spend */}
            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {activeTab === 'kitchen' && 'Kitchen Spend'}
                  {activeTab === 'personal' && 'Personal Spend'}
                  {activeTab === 'combined' && 'Total Combined Outflow'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {CURRENCY_SYMBOL}
                  {summary.totalAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {summary.transactionCount} {summary.transactionCount === 1 ? 'record' : 'records'} in period
                </p>
              </CardContent>
            </Card>

            {/* Today's Spend */}
            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Today's Outflow
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {CURRENCY_SYMBOL}
                  {summary.todayAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Logged for today</p>
              </CardContent>
            </Card>

            {/* Top Category */}
            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                  Top Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                {summary.topCategory ? (
                  <div>
                    <div className="text-lg sm:text-xl font-bold tracking-tight truncate text-foreground">
                      {summary.topCategory.name}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {CURRENCY_SYMBOL}
                      {summary.topCategory.amount.toLocaleString('en-IN')} ({summary.topCategory.percentage}%)
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-muted-foreground">None</div>
                    <p className="text-[11px] text-muted-foreground mt-1">No data in period</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Split */}
            <Card className="shadow-2xs">
              <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Payment Modes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="text-sm font-semibold flex items-center justify-between text-foreground">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Banknote className="size-3.5" /> Cash:
                  </span>
                  <span>
                    {CURRENCY_SYMBOL}
                    {summary.cashTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-sm font-semibold flex items-center justify-between mt-1 text-foreground">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <QrCode className="size-3.5" /> UPI/Card:
                  </span>
                  <span>
                    {CURRENCY_SYMBOL}
                    {(summary.upiTotal + summary.cardTotal + summary.bankTotal).toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category-wise Distribution Section */}
          <CategoryBreakdownChart
            data={categoryBreakdown}
            totalAmount={summary.totalAmount}
            selectedCategory={selectedCategory}
            scope={activeTab === 'kitchen' ? 'kitchen' : activeTab === 'personal' ? 'personal' : 'combined'}
            onSelectCategory={setSelectedCategory}
          />

          {/* Search, Filter Bar, and Records List */}
          <Card className="shadow-2xs overflow-hidden">
            <CardHeader className="p-4 border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">
                    {activeTab === 'kitchen' && 'Kitchen Expense Records'}
                    {activeTab === 'personal' && 'Personal Expense Records'}
                    {activeTab === 'combined' && 'Combined Records'}
                  </CardTitle>
                  <Badge variant="secondary" className="rounded-full text-xs">
                    {filteredExpenses.length}
                  </Badge>
                </div>

                {/* Search Input & Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 sm:w-52">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search item, vendor, member..."
                      className="pl-9 h-10 text-xs"
                    />
                  </div>

                  {/* Admin / Family Spender Dropdown */}
                  <select
                    value={selectedSpender}
                    onChange={(e) => setSelectedSpender(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] sm:min-h-[40px]"
                  >
                    <option value="all">All Members</option>
                    {spenders.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  {/* Category Dropdown (Filtered to relevant categories) */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] sm:min-h-[40px]"
                  >
                    <option value="all">All Categories</option>
                    {relevantCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Payment Method Dropdown */}
                  <select
                    value={selectedPayment}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] sm:min-h-[40px]"
                  >
                    <option value="all">All Payments</option>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>

                  {hasActiveFilters && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="min-h-[44px] sm:min-h-[40px] text-xs text-muted-foreground hover:text-foreground gap-1"
                    >
                      <RotateCcw className="size-3.5" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {/* Mobile Dedicated View (lg:hidden) as mandated by AGENTS.md */}
              <div className="lg:hidden">
                <ExpensesMobileList
                  expenses={filteredExpenses}
                  categories={categories}
                  showTypeBadge={activeTab === 'combined'}
                  onEdit={handleOpenEditExpense}
                  onDelete={handleDeleteExpense}
                />
              </div>

              {/* Desktop Table View (hidden lg:block) */}
              <div className="hidden lg:block overflow-x-auto">
                {filteredExpenses.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground text-sm">
                    <p className="font-semibold text-foreground">No expenses match your criteria</p>
                    <p className="text-xs mt-1">
                      {activeTab === 'kitchen' && 'Try resetting filters or log a new kitchen expense.'}
                      {activeTab === 'personal' && 'Try resetting filters or log a personal expense.'}
                      {activeTab === 'combined' && 'Try resetting filters or log an expense.'}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Date</TableHead>
                        {activeTab === 'combined' && <TableHead className="w-28">Type</TableHead>}
                        <TableHead className="w-44">Category</TableHead>
                        <TableHead>Item / Description</TableHead>
                        <TableHead className="w-36">Spent By</TableHead>
                        <TableHead className="w-36">Vendor / Store</TableHead>
                        <TableHead className="w-28">Payment</TableHead>
                        <TableHead className="w-32 text-right">Amount</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((exp) => {
                        const cat = categoryMap.get(exp.categoryId)
                        const isPersonal = (exp.expenseType || 'kitchen') === 'personal'

                        return (
                          <TableRow key={exp.id}>
                            <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {dayjs(exp.date).format('DD MMM YYYY')}
                            </TableCell>
                            {activeTab === 'combined' && (
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                                    isPersonal
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                      : 'bg-primary/10 text-primary border border-primary/20'
                                  }`}
                                >
                                  {isPersonal ? '👤 Personal' : '🍳 Kitchen'}
                                </span>
                              </TableCell>
                            )}
                            <TableCell>
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-2xs whitespace-nowrap"
                                style={{ backgroundColor: cat?.color || '#64748b' }}
                              >
                                <CategoryIcon name={cat?.iconName || 'Tag'} className="size-3" />
                                <span>{cat?.name || 'Other'}</span>
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-sm text-foreground">
                                {exp.title}
                              </div>
                              {exp.notes && (
                                <div className="text-xs text-muted-foreground truncate max-w-md mt-0.5">
                                  {exp.notes}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {exp.spentByName ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary whitespace-nowrap">
                                  <UserCheck className="size-3" />
                                  <span>{exp.spentByName}</span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {exp.vendor || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] capitalize">
                                {exp.paymentMethod.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-sm text-foreground">
                              {CURRENCY_SYMBOL}
                              {Number(exp.amount).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEditExpense(exp)}
                                  className="size-8"
                                  aria-label={`Edit ${exp.title}`}
                                >
                                  <Edit2 className="size-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteExpense(exp.id)}
                                  className="size-8"
                                  aria-label={`Delete ${exp.title}`}
                                >
                                  <Trash2 className="size-3.5 text-destructive hover:text-destructive/80" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Floating Action Button (FAB) on Mobile for quick 1-tap action */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <Button
          type="button"
          onClick={() => (activeTab === 'income' ? handleOpenAddIncome() : handleOpenAddExpense())}
          className={`size-14 rounded-full shadow-lg text-white flex items-center justify-center p-0 ${
            activeTab === 'income' ? 'bg-emerald-600' : 'bg-primary'
          }`}
          aria-label={activeTab === 'income' ? 'Record income' : 'Log new expense'}
        >
          <Plus className="size-6 stroke-[3]" />
        </Button>
      </div>

      {/* Expense Form Modal */}
      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expenseToEdit={editingExpense}
        categories={categories}
        spenders={spenders}
        defaultExpenseType={activeTab === 'personal' ? 'personal' : 'kitchen'}
        onSave={handleSaveExpense}
      />

      {/* Income Form Modal */}
      <IncomeFormDialog
        open={incomeFormOpen}
        onOpenChange={setIncomeFormOpen}
        incomeToEdit={editingIncome}
        spenders={spenders}
        defaultMemberId={selectedMemberForAction}
        onSave={handleSaveIncome}
      />

      {/* Opening Balances Modal */}
      <OpeningBalancesDialog
        open={openingBalancesDialogOpen}
        onOpenChange={setOpeningBalancesDialogOpen}
        spenders={spenders}
        initialBalances={openingBalances}
        onSave={handleSaveOpeningBalances}
      />

      {/* Category Manager Modal */}
      <CategoryManagerDialog
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
        categories={categories}
        expenses={expenses}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  )
}
