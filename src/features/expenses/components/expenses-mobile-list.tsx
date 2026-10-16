import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CategoryIcon } from './category-icon'
import type { ExpenseRecord, ExpenseCategory } from '../types'
import { CURRENCY_SYMBOL } from '@/constants'
import { Edit2, Trash2, Store, Calendar, FileText, Banknote, QrCode, CreditCard, Building, UserCheck } from 'lucide-react'

interface ExpensesMobileListProps {
  expenses: ExpenseRecord[]
  categories: ExpenseCategory[]
  onEdit: (expense: ExpenseRecord) => void
  onDelete: (id: string) => void
}

const PAYMENT_ICON_MAP = {
  cash: Banknote,
  upi: QrCode,
  card: CreditCard,
  bank_transfer: Building,
}

export function ExpensesMobileList({
  expenses,
  categories,
  onEdit,
  onDelete,
}: ExpensesMobileListProps) {
  const catMap = new Map(categories.map((c) => [c.id, c]))

  if (expenses.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center bg-card">
        <p className="font-semibold text-foreground text-sm">No expenses found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Try adjusting your date or category filters.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => {
        const cat = catMap.get(expense.categoryId)
        const PayIcon = PAYMENT_ICON_MAP[expense.paymentMethod] || Banknote

        return (
          <div
            key={expense.id}
            className="rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-primary/30"
          >
            {/* Top row: Category Badge & Date */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white shadow-2xs"
                style={{ backgroundColor: cat?.color || '#64748b' }}
              >
                <CategoryIcon name={cat?.iconName || 'Tag'} className="size-3.5" />
                <span>{cat?.name || 'Other'}</span>
              </span>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Calendar className="size-3" />
                <span>{dayjs(expense.date).format('DD MMM YYYY')}</span>
              </div>
            </div>

            {/* Middle: Title & Amount */}
            <div className="flex items-start justify-between gap-3 my-1">
              <h4 className="font-semibold text-foreground text-base leading-snug">
                {expense.title}
              </h4>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-lg text-foreground tracking-tight">
                  {CURRENCY_SYMBOL}
                  {Number(expense.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Vendor & Notes */}
            {(expense.vendor || expense.notes) && (
              <div className="space-y-1 my-2 text-xs text-muted-foreground">
                {expense.vendor && (
                  <div className="flex items-center gap-1.5 font-medium">
                    <Store className="size-3.5 text-muted-foreground/80 shrink-0" />
                    <span className="truncate">{expense.vendor}</span>
                  </div>
                )}
                {expense.notes && (
                  <div className="flex items-start gap-1.5 italic text-muted-foreground/90">
                    <FileText className="size-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{expense.notes}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom: Payment Method, Spent By Badge & Actions (touch targets >= 44px) */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 mt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[11px] gap-1 font-medium capitalize py-1">
                  <PayIcon className="size-3" />
                  <span>{expense.paymentMethod.replace('_', ' ')}</span>
                </Badge>
                {expense.spentByName && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    <UserCheck className="size-3" />
                    <span>{expense.spentByName}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(expense)}
                  className="min-h-[44px] min-w-[44px] text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="size-4 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(expense.id)}
                  className="min-h-[44px] min-w-[44px] text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
