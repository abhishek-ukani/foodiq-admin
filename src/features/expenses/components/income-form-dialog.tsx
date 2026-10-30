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
import type { IncomeRecord, PaymentMethod, ExpenseSpender } from '../types'
import { DEFAULT_INCOME_CATEGORIES } from '../services/expense-storage'
import { CURRENCY_SYMBOL } from '@/constants'
import {
  Wallet,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  UserCheck,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface IncomeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incomeToEdit: IncomeRecord | null
  spenders: ExpenseSpender[]
  defaultMemberId?: string
  onSave: (income: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
}

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'bank_transfer', label: 'Bank / Net', icon: Building },
  { key: 'upi', label: 'UPI / GPay', icon: QrCode },
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Card / Cheque', icon: CreditCard },
]

interface InnerFormProps {
  incomeToEdit: IncomeRecord | null
  spenders: ExpenseSpender[]
  defaultMemberId?: string
  onCancel: () => void
  onSubmitSuccess: (data: Omit<IncomeRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void
}

function InnerIncomeForm({
  incomeToEdit,
  spenders,
  defaultMemberId,
  onCancel,
  onSubmitSuccess,
}: InnerFormProps) {
  const [memberId, setMemberId] = useState(
    incomeToEdit?.memberId || defaultMemberId || spenders[0]?.id || '',
  )
  const [title, setTitle] = useState(incomeToEdit?.title || '')
  const [amount, setAmount] = useState(incomeToEdit ? String(incomeToEdit.amount) : '')
  const [category, setCategory] = useState(incomeToEdit?.category || 'salary')
  const [date, setDate] = useState(incomeToEdit?.date || dayjs().format('YYYY-MM-DD'))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    incomeToEdit?.paymentMethod || 'bank_transfer',
  )
  const [notes, setNotes] = useState(incomeToEdit?.notes || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid income amount')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter an income source description')
      return
    }

    const selectedMember = spenders.find((s) => s.id === (memberId || spenders[0]?.id))

    onSubmitSuccess({
      id: incomeToEdit?.id,
      title: title.trim(),
      amount: parsedAmount,
      memberId: selectedMember?.id || 'admin',
      memberName: selectedMember?.name || 'Admin',
      category,
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
    })

    toast.success(incomeToEdit ? 'Income updated' : 'Income recorded successfully')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* 1. Earned By Member Selection */}
      {spenders.length > 0 && (
        <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
            <UserCheck className="size-3.5 text-primary" />
            Earned By (Family Member) *
          </Label>

          <div
            className={`grid grid-cols-1 ${
              spenders.length <= 2
                ? 'sm:grid-cols-2'
                : spenders.length <= 4
                  ? 'sm:grid-cols-2 lg:grid-cols-4'
                  : 'sm:grid-cols-3 lg:grid-cols-5'
            } gap-2 pt-1`}
          >
            {spenders.map((spender) => {
              const isSelected = (memberId || spenders[0]?.id) === spender.id
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
                  onClick={() => setMemberId(spender.id)}
                  className={`flex min-h-[44px] items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-border bg-card hover:bg-muted text-foreground'
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-emerald-600 text-white'
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
        <Label htmlFor="income-amount" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Income Amount Received *
        </Label>
        <div className="relative rounded-xl border border-input focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground font-semibold text-lg">
            {CURRENCY_SYMBOL}
          </div>
          <Input
            id="income-amount"
            type="number"
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="h-13 pl-8 text-2xl font-bold border-none shadow-none focus-visible:ring-0 text-emerald-600 dark:text-emerald-400"
            autoFocus={!incomeToEdit}
          />
        </div>
      </div>

      {/* 3. Category Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Income Stream / Category *
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEFAULT_INCOME_CATEGORIES.map((cat) => {
            const isSelected = category === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20 shadow-xs font-semibold'
                    : 'border-border bg-card hover:bg-muted text-foreground'
                }`}
              >
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 4. Title / Source */}
      <div className="space-y-1.5">
        <Label htmlFor="income-title">Source / Description *</Label>
        <Input
          id="income-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. October Monthly Salary, Shop Sales Payout, Dividend"
          className="h-11 text-base sm:text-sm"
        />
      </div>

      {/* 5. Date & Payment Method */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="income-date">Date Received</Label>
          <Input
            id="income-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 text-base sm:text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Deposit Mode
          </Label>
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map((pm) => {
              const Icon = pm.icon
              const isSelected = paymentMethod === pm.key
              return (
                <button
                  key={pm.key}
                  type="button"
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border px-2 py-1 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                      : 'border-border bg-card hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="truncate">{pm.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 6. Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="income-notes">Notes / Reference (Optional)</Label>
        <Textarea
          id="income-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any reference number, bank account note, or detail..."
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
        <Button
          type="submit"
          className="min-h-[44px] px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {incomeToEdit ? 'Save Changes' : 'Record Income'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function IncomeFormDialog({
  open,
  onOpenChange,
  incomeToEdit,
  spenders,
  defaultMemberId,
  onSave,
}: IncomeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] sm:max-w-xl md:max-w-2xl max-h-[92vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader className="pr-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                {incomeToEdit ? 'Edit Income Record' : 'Record Family Member Income'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                Log earnings, salaries, business profits, or returns per family member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {open && (
          <InnerIncomeForm
            key={incomeToEdit?.id ?? `new-income-${defaultMemberId}`}
            incomeToEdit={incomeToEdit}
            spenders={spenders}
            defaultMemberId={defaultMemberId}
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
