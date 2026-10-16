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
} from '../services/expense-storage'
import type { ExpenseRecord, ExpenseCategory, ExpenseFilterPreset, ExpenseSpender } from '../types'
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

  // Filters
  const [preset, setPreset] = useState<ExpenseFilterPreset>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<string>('all')
  const [selectedSpender, setSelectedSpender] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null)
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false)

  // Sync real-time admin profiles from Supabase
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

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return filterExpenses(expenses, {
      from: dateRange.from,
      to: dateRange.to,
      categoryId: selectedCategory,
      paymentMethod: selectedPayment,
      spentById: selectedSpender,
      searchQuery,
    })
  }, [expenses, dateRange, selectedCategory, selectedPayment, selectedSpender, searchQuery])

  // Summary Metrics & Category Distribution
  const summary = useMemo(() => {
    return computeExpenseSummary(filteredExpenses, expenses, categories)
  }, [filteredExpenses, expenses, categories])

  const categoryBreakdown = useMemo(() => {
    return computeCategoryBreakdown(filteredExpenses, categories)
  }, [filteredExpenses, categories])

  // Category map for quick lookup
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]))
  }, [categories])

  // Handlers
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

  const handleOpenAdd = () => {
    setEditingExpense(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (expense: ExpenseRecord) => {
    setEditingExpense(expense)
    setFormOpen(true)
  }

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
    setSelectedPayment('all')
    setSelectedSpender('all')
    setSearchQuery('')
    setCustomFrom('')
    setCustomTo('')
  }

  const hasActiveFilters =
    preset !== 'month' ||
    selectedCategory !== 'all' ||
    selectedPayment !== 'all' ||
    selectedSpender !== 'all' ||
    Boolean(searchQuery.trim())

  return (
    <div className="space-y-6 pb-20 lg:pb-6">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
            Kitchen Expenses
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track daily kitchen purchases, ingredients, fuel, utilities, and category breakdowns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => exportExpensesCsv(filteredExpenses, categories)}
            className="min-h-[44px] gap-1.5 shadow-2xs"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Export</span> CSV
          </Button>

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

          <Button
            type="button"
            onClick={handleOpenAdd}
            size="sm"
            className="min-h-[44px] gap-1.5 bg-primary font-semibold text-primary-foreground shadow-xs"
          >
            <Plus className="size-4 stroke-[3]" />
            Log Expense
          </Button>
        </div>
      </div>

      {/* 2. Date Presets Bar (Horizontal Scroll on Mobile) */}
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

      {/* 3. KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spend */}
        <Card className="shadow-2xs">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {CURRENCY_SYMBOL}
              {summary.totalAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {summary.transactionCount} {summary.transactionCount === 1 ? 'record' : 'records'} in
              period
            </p>
          </CardContent>
        </Card>

        {/* Today's Spend */}
        <Card className="shadow-2xs">
          <CardHeader className="p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Today's Spend
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

      {/* 4. Category-wise Distribution Section */}
      <CategoryBreakdownChart
        data={categoryBreakdown}
        totalAmount={summary.totalAmount}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* 5. Search, Filter Bar, and Records List */}
      <Card className="shadow-2xs overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">Expense Records</CardTitle>
              <Badge variant="secondary" className="rounded-full text-xs">
                {filteredExpenses.length}
              </Badge>
            </div>

            {/* Search Input & Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, vendor, member..."
                  className="pl-9 h-10 text-xs"
                />
              </div>

              {/* Super User / Family Member Dropdown */}
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

              {/* Category Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-10 rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[44px] sm:min-h-[40px]"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
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
              onEdit={handleOpenEdit}
              onDelete={handleDeleteExpense}
            />
          </div>

          {/* Desktop Table View (hidden lg:block) */}
          <div className="hidden lg:block overflow-x-auto">
            {filteredExpenses.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <p className="font-semibold text-foreground">No expenses match your criteria</p>
                <p className="text-xs mt-1">Try resetting filters or log a new kitchen expense.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead className="w-44">Category</TableHead>
                    <TableHead>Item / Description</TableHead>
                    <TableHead className="w-36">Spent By</TableHead>
                    <TableHead className="w-36">Vendor</TableHead>
                    <TableHead className="w-28">Payment</TableHead>
                    <TableHead className="w-32 text-right">Amount</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((exp) => {
                    const cat = categoryMap.get(exp.categoryId)
                    return (
                      <TableRow key={exp.id}>
                        <TableCell className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                          {dayjs(exp.date).format('DD MMM YYYY')}
                        </TableCell>
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
                              onClick={() => handleOpenEdit(exp)}
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

      {/* Floating Action Button (FAB) on Mobile for quick 1-tap logging */}
      <div className="fixed bottom-6 right-6 lg:hidden z-30">
        <Button
          type="button"
          onClick={handleOpenAdd}
          className="size-14 rounded-full shadow-lg bg-primary text-primary-foreground flex items-center justify-center p-0"
          aria-label="Log new expense"
        >
          <Plus className="size-6 stroke-[3]" />
        </Button>
      </div>

      {/* Modals */}
      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expenseToEdit={editingExpense}
        categories={categories}
        spenders={spenders}
        onSave={handleSaveExpense}
      />

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
