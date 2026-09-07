import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import { OrderStatusTimeline } from '@/components/common/order-status-timeline'
import { useUpdateOrderDeliveryCharge, useUpdateOrderStatus } from '@/features/orders/hooks/use-orders'
import type { AdminOrder } from '@/features/orders/services/orders-service'
import { CURRENCY_SYMBOL } from '@/constants'
import type { OrderStatus } from '@/types/database.types'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'accepted', label: 'Accept order' },
  accepted: { status: 'ready', label: 'Mark ready' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'out_for_delivery', label: 'Out for delivery' },
  out_for_delivery: { status: 'delivered', label: 'Mark delivered' },
}

const CANCELLABLE: OrderStatus[] = ['pending', 'accepted', 'ready']

export function OrderDetailDialog({
  order,
  onOpenChange,
}: {
  order: AdminOrder | null
  onOpenChange: (open: boolean) => void
}) {
  const updateStatus = useUpdateOrderStatus()
  const updateCharge = useUpdateOrderDeliveryCharge()
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [customCharge, setCustomCharge] = useState<number>(0)

  useEffect(() => {
    if (order) {
      setCustomCharge(order.delivery_charge || 0)
    }
  }, [order])

  if (!order) return null

  const next = NEXT_STATUS[order.status]
  const canCancel = CANCELLABLE.includes(order.status)

  const reset = () => {
    setReason('')
    setShowReject(false)
    setShowCancel(false)
  }

  const handleUpdateCharge = () => {
    updateCharge.mutate({ id: order.id, deliveryCharge: Number(customCharge) })
  }

  return (
    <Dialog
      open={Boolean(order)}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) reset()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{order.order_number}</DialogTitle>
            <OrderStatusBadge status={order.status} />
            {order.is_out_of_zone && (
              <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                🟡 Out of Zone
              </span>
            )}
          </div>
          <DialogDescription>
            Placed {dayjs(order.placed_at).format('D MMM YYYY, h:mm A')} by {order.contact_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm space-y-1">
            <p className="font-medium">{order.contact_name} ({order.contact_phone})</p>
            <p className="text-muted-foreground">
              {order.address_line1}, {order.city}, {order.pincode}
            </p>
            {order.zone_label && (
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                📍 Zone: {order.zone_label}
              </p>
            )}
            {order.preferred_lunch_time && (
              <p className="text-xs font-medium text-primary">
                🍱 Preferred Lunch Time: {order.preferred_lunch_time}
              </p>
            )}
            <p className="text-muted-foreground text-xs pt-1">
              Delivery Date: {dayjs(order.delivery_date).format('D MMM YYYY')}
            </p>
          </div>

          {/* Out-of-Zone Charge Adjustment */}
          {order.is_out_of_zone ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm space-y-2">
              <p className="font-semibold text-amber-700 dark:text-amber-400 text-xs uppercase tracking-wide">
                🟡 Unconfirmed Delivery Charge
              </p>
              <p className="text-xs text-muted-foreground">
                This customer requested delivery outside standard zones. Set the custom delivery charge below to confirm:
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{CURRENCY_SYMBOL}</span>
                <Input
                  type="number"
                  value={customCharge}
                  onChange={(e) => setCustomCharge(Number(e.target.value))}
                  className="w-28 h-8 text-xs font-mono"
                  placeholder="Charge"
                />
                <Button size="sm" h-8 onClick={handleUpdateCharge} disabled={updateCharge.isPending}>
                  {updateCharge.isPending ? 'Saving...' : 'Set Charge & Update Total'}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {order.order_items.map((item) => {
              const snapshot = (item.item_snapshot as { name: string; quantity: number }[] | null) ?? []
              const addOns = (item.customizations as { name: string; price_delta: number }[] | null) ?? []
              return (
                <div key={item.id} className="text-sm">
                  <div className="flex justify-between">
                    <span>
                      {item.item_name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      {CURRENCY_SYMBOL}
                      {item.line_total}
                    </span>
                  </div>
                  {snapshot.length ? (
                    <p className="text-muted-foreground text-xs">
                      {snapshot.map((c) => c.name).join(', ')}
                    </p>
                  ) : null}
                  {addOns.length ? (
                    <p className="text-muted-foreground text-xs">
                      + {addOns.map((c) => c.name).join(', ')}
                    </p>
                  ) : null}
                </div>
              )
            })}
            <div className="border-t pt-2 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{CURRENCY_SYMBOL}{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery Charge</span>
                <span>{CURRENCY_SYMBOL}{order.delivery_charge}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{CURRENCY_SYMBOL}{order.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-sm pt-1 border-t">
                <span>Total</span>
                <span>
                  {CURRENCY_SYMBOL}
                  {order.total_amount}
                </span>
              </div>
            </div>
          </div>

          <OrderStatusTimeline status={order.status} />

          {showReject || showCancel ? (
            <div className="space-y-2">
              <Textarea
                placeholder={showReject ? 'Reason for rejecting (optional)' : 'Reason for cancelling (optional)'}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          {showReject || showCancel ? (
            <>
              <Button variant="outline" onClick={reset}>
                Back
              </Button>
              <Button
                variant="destructive"
                disabled={updateStatus.isPending}
                onClick={() =>
                  updateStatus.mutate(
                    { id: order.id, status: showReject ? 'rejected' : 'cancelled', reason },
                    { onSuccess: () => { reset(); onOpenChange(false) } },
                  )
                }
              >
                Confirm {showReject ? 'rejection' : 'cancellation'}
              </Button>
            </>
          ) : (
            <>
              <div className="flex gap-2">
                {order.status === 'pending' ? (
                  <Button variant="outline" className="text-destructive" onClick={() => setShowReject(true)}>
                    Reject
                  </Button>
                ) : canCancel ? (
                  <Button variant="outline" className="text-destructive" onClick={() => setShowCancel(true)}>
                    Cancel order
                  </Button>
                ) : null}
              </div>
              {next ? (
                <Button
                  disabled={updateStatus.isPending}
                  onClick={() => updateStatus.mutate({ id: order.id, status: next.status })}
                >
                  {updateStatus.isPending ? 'Updating…' : next.label}
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
