import dayjs from 'dayjs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { IncomeRecord } from '../types'
import { CURRENCY_SYMBOL } from '@/constants'
import {
  Edit2,
  Trash2,
  Calendar,
  FileText,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  UserCheck,
  TrendingUp,
} from 'lucide-react'

interface IncomesMobileListProps {
  incomes: IncomeRecord[]
  onEdit: (income: IncomeRecord) => void
  onDelete: (id: string) => void
}

const PAYMENT_ICON_MAP = {
  cash: Banknote,
  upi: QrCode,
  card: CreditCard,
  bank_transfer: Building,
}

export function IncomesMobileList({ incomes, onEdit, onDelete }: IncomesMobileListProps) {
  if (incomes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-8 text-center bg-card">
        <p className="font-semibold text-foreground text-sm">No income records found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Log salary, business profit, or returns for family members.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {incomes.map((income) => {
        const PayIcon = PAYMENT_ICON_MAP[income.paymentMethod] || Banknote

        return (
          <div
            key={income.id}
            className="rounded-2xl border bg-card p-4 shadow-2xs transition-all hover:border-emerald-500/30"
          >
            {/* Top row: Category Badge & Date */}
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-2xs capitalize">
                <TrendingUp className="size-3.5" />
                <span>{income.category.replace('_', ' ')}</span>
              </span>

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                <Calendar className="size-3" />
                <span>{dayjs(income.date).format('DD MMM YYYY')}</span>
              </div>
            </div>

            {/* Middle: Title & Amount */}
            <div className="flex items-start justify-between gap-3 my-1">
              <h4 className="font-semibold text-foreground text-base leading-snug">
                {income.title}
              </h4>
              <div className="text-right shrink-0">
                <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">
                  +{CURRENCY_SYMBOL}
                  {Number(income.amount).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Notes */}
            {income.notes && (
              <div className="my-2 text-xs text-muted-foreground flex items-start gap-1.5 italic">
                <FileText className="size-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{income.notes}</span>
              </div>
            )}

            {/* Bottom: Payment Mode, Member Badge & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 mt-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="text-[11px] gap-1 font-medium capitalize py-1">
                  <PayIcon className="size-3" />
                  <span>{income.paymentMethod.replace('_', ' ')}</span>
                </Badge>
                {income.memberName && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-full px-2 py-0.5">
                    <UserCheck className="size-3" />
                    <span>{income.memberName}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(income)}
                  className="min-h-[44px] min-w-[44px] text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <Edit2 className="size-4 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(income.id)}
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
