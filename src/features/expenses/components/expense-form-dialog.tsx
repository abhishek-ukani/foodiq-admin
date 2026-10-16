import { useState } from 'react'
import dayjs from 'dayjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CategoryIcon } from './category-icon'
import type { ExpenseCategory, ExpenseRecord, PaymentMethod, ExpenseSpender } from '../types'
import { CURRENCY_SYMBOL } from '@/constants'
import { Receipt, Banknote, QrCode, CreditCard, Building, UserCheck, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expenseToEdit: ExpenseRecord | null
  categories: ExpenseCategory[]
  spenders: ExpenseSpender[]
  onSave: (expense: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'upi', label: 'UPI / GPay', icon: QrCode },
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'bank_transfer', label: 'Bank / Net', icon: Building },
]

interface InnerFormProps {
  expenseToEdit: ExpenseRecord | null
  categories: ExpenseCategory[]
  spenders: ExpenseSpender[]
  onCancel: () => void
  onSubmitSuccess: (data: Omit<ExpenseRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
}

function InnerExpenseForm({
  expenseToEdit,
  categories,
  spenders,
  onCancel,
  onSubmitSuccess,
}: InnerFormProps) {
  const [title, setTitle] = useState(expenseToEdit?.title || '')
  const [amount, setAmount] = useState(expenseToEdit ? String(expenseToEdit.amount) : '')
  const [categoryId, setCategoryId] = useState(expenseToEdit?.categoryId || categories[0]?.id || '')
  const [spentById, setSpentById] = useState(expenseToEdit?.spentById || spenders[0]?.id || '')
  const [date, setDate] = useState(expenseToEdit?.date || dayjs().format('YYYY-MM-DD'))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(expenseToEdit?.paymentMethod || 'cash')
  const [vendor, setVendor] = useState(expenseToEdit?.vendor || '')
  const [notes, setNotes] = useState(expenseToEdit?.notes || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid expense amount')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter an item or description')
      return
    }

    if (!categoryId) {
      toast.error('Please select an expense category')
      return
    }

    const selectedSpender = spenders.find((s) => s.id === (spentById || spenders[0]?.id))

    onSubmitSuccess({
      id: expenseToEdit?.id,
      title: title.trim(),
      amount: parsedAmount,
      categoryId,
      spentById: selectedSpender?.id,
      spentByName: selectedSpender?.name,
      date,
      paymentMethod,
      vendor: vendor.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    toast.success(expenseToEdit ? 'Expense updated' : 'Expense recorded successfully')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* 1. Who spent it? Super User / Family Member Selection */}
      {spenders.length > 0 && (
        <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <UserCheck className="size-3.5 text-primary" />
            Spent By (Admin User) *
          </Label>

          <div
            className={`grid grid-cols-1 ${
              spenders.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
            } gap-2 pt-1`}
          >
            {spenders.map((spender) => {
              const isSelected = (spentById || spenders[0]?.id) === spender.id
              const initials = spender.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()

              return (
                <button
                  key={spender.id}
                  type="button"
                  onClick={() => setSpentById(spender.id)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isSelected ? <Check className="size-3.5 stroke-[3]" /> : initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight">{spender.name}</p>
                    {spender.role && (
                      <p className="truncate text-[10px] text-muted-foreground">{spender.role}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 2. Amount Input */}
      <div className="space-y-1.5">
        <Label htmlFor="expense-amount" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Amount Spent *
        </Label>
        <div className="relative rounded-xl border border-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground font-semibold text-lg">
            {CURRENCY_SYMBOL}
          </div>
          <Input
            id="expense-amount"
            type="number"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-13 pl-8 text-2xl font-bold border-none shadow-none focus-visible:ring-0"
            autoFocus={!expenseToEdit}
          />
        </div>
      </div>

      {/* 3. Category Quick Chips */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Category *
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
          {categories.map((cat) => {
            const isSelected = categoryId === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex min-h-[44px] items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-border bg-card hover:bg-muted text-foreground'
                }`}
              >
                <span
                  className="flex size-6 shrink-0 items-center justify-center rounded-md text-white text-xs"
                  style={{ backgroundColor: cat.color }}
                >
                  <CategoryIcon name={cat.iconName} className="size-3.5" />
                </span>
                <span className="truncate">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Title / Description */}
      <div className="space-y-1.5">
        <Label htmlFor="expense-title">Item / Description *</Label>
        <Input
          id="expense-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 50kg Onion sack, HP Petrol refill, 2x Kadai"
          className="h-11 text-base sm:text-sm"
        />
      </div>

      {/* 5. Date & Vendor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="expense-date">Date</Label>
          <Input
            id="expense-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 text-base sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expense-vendor">Vendor / Merchant</Label>
          <Input
            id="expense-vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="e.g. APMC Mandi, Bharat Petroleum"
            className="h-11 text-base sm:text-sm"
          />
        </div>
      </div>

      {/* 6. Payment Method Selector (touch targets >= 44px) */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Payment Method
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => {
            const Icon = pm.icon
            const isSelected = paymentMethod === pm.key
            return (
              <button
                key={pm.key}
                type="button"
                onClick={() => setPaymentMethod(pm.key)}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'border-border bg-card hover:bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="size-4 shrink-0" />
                <span>{pm.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 7. Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="expense-notes">Notes / Bill Details (Optional)</Label>
        <Textarea
          id="expense-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional details, invoice ref number, or batch info..."
          rows={2}
          className="resize-none"
        />
      </div>

      <DialogFooter className="pt-2 gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
        <Button type="submit" className="min-h-[44px] px-6">
          {expenseToEdit ? 'Save Changes' : 'Log Expense'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expenseToEdit,
  categories,
  spenders,
  onSave,
}: ExpenseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {expenseToEdit ? 'Edit Kitchen Expense' : 'Log Kitchen Expense'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Record kitchen purchases, mandi runs, fuel, and overheads.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <InnerExpenseForm
            key={expenseToEdit?.id ?? 'new-expense'}
            expenseToEdit={expenseToEdit}
            categories={categories}
            spenders={spenders}
            onCancel={() => onOpenChange(false)}
            onSubmitSuccess={(data) => {
              onSave(data)
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
