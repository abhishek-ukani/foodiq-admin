import { Calendar, CheckCircle2, Clock, Ban, Sparkles, MapPin, User } from 'lucide-react'
import dayjs from 'dayjs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSubscriptionLedger } from '../hooks/use-subscriptions'
import type { AdminSubscriptionWithDetails, SubscriptionDayRow } from '../services/subscriptions-service'

type CustomerLedgerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  subscription: AdminSubscriptionWithDetails | null
}

export function CustomerLedgerDialog({
  open,
  onOpenChange,
  subscription,
}: CustomerLedgerDialogProps) {
  const { data: ledger, isLoading } = useSubscriptionLedger(subscription?.id ?? null)

  if (!subscription) return null

  const deliveredCount = (ledger || []).filter((d) => d.status === 'delivered').length
  const skippedCount = (ledger || []).filter((d) => d.status === 'skipped').length
  const cancelledCount = (ledger || []).filter((d) => d.status === 'kitchen_cancelled').length
  const scheduledCount = (ledger || []).filter((d) => d.status === 'scheduled').length

  // Plan's end date is the date of the LAST scheduled row
  const scheduledDays = (ledger || []).filter((d) => d.status === 'scheduled')
  const lastScheduledDate =
    scheduledDays.length > 0
      ? scheduledDays[scheduledDays.length - 1].delivery_date
      : subscription.start_date

  const getStatusBadge = (status: SubscriptionDayRow['status']) => {
    switch (status) {
      case 'delivered':
        return (
          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1">
            <CheckCircle2 className="size-3" /> Delivered
          </Badge>
        )
      case 'skipped':
        return (
          <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 font-medium text-xs gap-1">
            <Clock className="size-3" /> Customer Skipped
          </Badge>
        )
      case 'kitchen_cancelled':
        return (
          <Badge variant="secondary" className="text-muted-foreground bg-muted font-medium text-xs gap-1">
            <Ban className="size-3" /> Kitchen Closed
          </Badge>
        )
      case 'scheduled':
      default:
        return (
          <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 font-medium text-xs gap-1">
            <Calendar className="size-3" /> Scheduled
          </Badge>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="font-display text-xl font-bold">
                  {subscription.subscription_number}
                </DialogTitle>
                <Badge variant="outline" className="capitalize font-semibold">
                  {subscription.plan_variants?.name} ({subscription.meal_slot})
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Purchased on {dayjs(subscription.created_at).format('MMM D, YYYY')}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-muted-foreground">Effective Plan Ends On</span>
              <p className="font-bold text-base text-primary">
                {dayjs(lastScheduledDate).format('dddd, MMMM D, YYYY')}
              </p>
            </div>
          </div>

          {/* Customer & Address Quick Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
            <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg">
              <User className="size-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold">{subscription.profiles?.full_name || 'Customer'}</span>
                <span className="text-muted-foreground ml-2">({subscription.profiles?.phone || 'No phone'})</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted/40 p-2.5 rounded-lg">
              <MapPin className="size-4 text-primary shrink-0" />
              <div className="truncate">
                <span className="font-medium text-muted-foreground">
                  {subscription.addresses?.address_line1}, {subscription.addresses?.city}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger Metric Summary */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
              <p className="text-[11px] text-emerald-800 font-medium">Delivered</p>
              <p className="text-lg font-bold text-emerald-700">
                {deliveredCount} <span className="text-xs font-normal">/ {subscription.duration_meal_days}</span>
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2">
              <p className="text-[11px] text-blue-800 font-medium">Remaining</p>
              <p className="text-lg font-bold text-blue-700">{scheduledCount}</p>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2">
              <p className="text-[11px] text-amber-800 font-medium">Skips Used</p>
              <p className="text-lg font-bold text-amber-700">
                {skippedCount} <span className="text-xs font-normal">/ {subscription.skip_limit}</span>
              </p>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <p className="text-[11px] text-muted-foreground font-medium">Kitchen Off</p>
              <p className="text-lg font-bold text-foreground">{cancelledCount}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Meal Ledger Table */}
        <div className="flex-1 overflow-y-auto pt-3">
          {isLoading ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-muted/50 rounded" />
              ))}
            </div>
          ) : !ledger || ledger.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No delivery days generated for this subscription.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Meal Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead className="text-right">Order Link</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((day: SubscriptionDayRow) => (
                  <TableRow key={day.id} className="text-xs">
                    <TableCell className="font-medium text-center text-muted-foreground">
                      {day.sequence_number}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {dayjs(day.delivery_date).format('ddd, MMM D, YYYY')}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {day.meal_slot}
                    </TableCell>
                    <TableCell>{getStatusBadge(day.status)}</TableCell>
                    <TableCell>
                      {day.includes_sweet ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Sparkles className="size-3 text-amber-500" /> Sweet 🍬
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {day.order_id ? (
                        <span className="text-[11px] font-mono text-primary font-semibold">
                          #{day.order_id.slice(0, 8)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50 text-[11px]">Unfulfilled</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
