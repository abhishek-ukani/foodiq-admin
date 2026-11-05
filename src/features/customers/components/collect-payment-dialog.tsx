import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { CheckCircle2, IndianRupee, Loader2, ReceiptText, Smartphone, User } from 'lucide-react'
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
import { useSettleOrdersPayment } from '@/features/customers/hooks/use-customers'
import { CURRENCY_SYMBOL } from '@/constants'

export interface OrderToCollect {
  id: string
  order_number: string
  total_amount: number
  placed_at?: string
  delivery_date?: string
}

interface CollectPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customerName?: string | null
  customerPhone?: string | null
  orders: OrderToCollect[]
  onSuccess?: () => void
}

export function CollectPaymentDialog({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  orders,
  onSuccess,
}: CollectPaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi'>('upi')
  const [paymentReference, setPaymentReference] = useState('')
  const settlePayment = useSettleOrdersPayment()

  const totalAmount = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  }, [orders])

  const handleConfirm = () => {
    if (!orders.length) return

    settlePayment.mutate(
      {
        orderIds: orders.map((o) => o.id),
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPaymentReference('')
          onOpenChange(false)
          onSuccess?.()
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ReceiptText className="size-4" />
            <span>Khata Payment Settlement</span>
          </div>
          <DialogTitle className="text-xl">Collect Payment</DialogTitle>
          <DialogDescription>
            Record received payment for {orders.length} {orders.length === 1 ? 'order' : 'orders'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Customer & Total Callout */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <User className="size-3.5" />
                <span>{customerName || 'Customer'}</span>
              </div>
              {customerPhone && (
                <p className="text-xs text-muted-foreground">{customerPhone}</p>
              )}
              <p className="text-xs text-primary font-medium mt-1">
                Settling {orders.length} unpaid {orders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground block">Amount to Collect</span>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                {CURRENCY_SYMBOL}
                {totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* List of Orders being collected */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Orders Breakdown
            </Label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border/80 divide-y divide-border/60 text-xs">
              {orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2.5 hover:bg-muted/30">
                  <div>
                    <span className="font-semibold text-foreground">{o.order_number}</span>
                    <span className="text-muted-foreground ml-2">
                      {dayjs(o.delivery_date || o.placed_at).format('DD MMM')}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {CURRENCY_SYMBOL}
                    {Number(o.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Payment Method
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 cursor-pointer text-center transition-all min-h-[56px] ${
                  paymentMethod === 'upi'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                    : 'border-border/80 hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <Smartphone className="size-5" />
                <span className="text-sm">UPI / QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-3.5 cursor-pointer text-center transition-all min-h-[56px] ${
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/10 text-primary font-semibold ring-2 ring-primary/20'
                    : 'border-border/80 hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <IndianRupee className="size-5" />
                <span className="text-sm">Cash</span>
              </button>
            </div>
          </div>

          {/* Reference Input for UPI */}
          {paymentMethod === 'upi' && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-200">
              <Label htmlFor="pay-ref" className="text-xs">
                UPI Reference / UTR Number (Optional)
              </Label>
              <Input
                id="pay-ref"
                placeholder="e.g. 423985729182 or GPay / PhonePe ref"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="text-xs"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={settlePayment.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={settlePayment.isPending || orders.length === 0}
            className="gap-2 min-h-[44px]"
          >
            {settlePayment.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Recording Payment…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Confirm Paid ({CURRENCY_SYMBOL}
                {totalAmount.toLocaleString('en-IN')})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
