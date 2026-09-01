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
import { Textarea } from '@/components/ui/textarea'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import { OrderStatusTimeline } from '@/components/common/order-status-timeline'
import { useUpdateOrderStatus } from '@/features/orders/hooks/use-orders'
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
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  if (!order) return null

  const next = NEXT_STATUS[order.status]
  const canCancel = CANCELLABLE.includes(order.status)

  const reset = () => {
    setReason('')
    setShowReject(false)
    setShowCancel(false)
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
          </div>
          <DialogDescription>
            Placed {dayjs(order.placed_at).format('D MMM YYYY, h:mm A')} by {order.contact_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">{order.contact_name}</p>
            <p className="text-muted-foreground">
              {order.address_line1}, {order.city}, {order.pincode}
            </p>
            <p className="text-muted-foreground mt-1">
              {dayjs(order.delivery_date).format('D MMM')} · {order.delivery_slot_label}
            </p>
          </div>

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
            <div className="flex justify-between border-t pt-2 font-semibold">
              <span>Total</span>
              <span>
                {CURRENCY_SYMBOL}
                {order.total_amount}
              </span>
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
