import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  Copy,
  ExternalLink,
  MapPin,
  Phone,
  Printer,
  Sparkles,
  UtensilsCrossed,
  Wheat,
  Soup,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MessageCircle,
  ChefHat,
} from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import { OrderStatusTimeline } from '@/components/common/order-status-timeline'
import { OrderPrintDialog } from '@/features/orders/components/order-print-dialog'
import { useUpdateOrderDeliveryCharge, useUpdateOrderStatus } from '@/features/orders/hooks/use-orders'
import type { AdminOrder } from '@/features/orders/services/orders-service'
import { parseOrderItemDetails, calculateKitchenProduction } from '@/features/orders/utils/order-parser'
import { CURRENCY_SYMBOL } from '@/constants'
import type { OrderStatus } from '@/types/database.types'
import toast from 'react-hot-toast'

const NEXT_STATUS: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  pending: { status: 'accepted', label: 'Accept Order' },
  accepted: { status: 'ready', label: 'Mark Ready for Pickup' },
  preparing: { status: 'ready', label: 'Mark Ready for Pickup' },
  ready: { status: 'out_for_delivery', label: 'Dispatch (Out for Delivery)' },
  out_for_delivery: { status: 'delivered', label: 'Mark as Delivered' },
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
  const [printOpen, setPrintOpen] = useState(false)

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

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number)
    toast.success('Order number copied to clipboard!')
  }

  const parsedItems = (order.order_items || []).map((item) => parseOrderItemDetails(item))
  const orderProduction = order ? calculateKitchenProduction([order]) : null

  const cleanPhone = (order.contact_phone || '').replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

  const fullAddress = [
    order.address_line1,
    order.address_line2,
    order.landmark ? `Near ${order.landmark}` : null,
    order.city,
    order.pincode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <Dialog
        open={Boolean(order)}
        onOpenChange={(open) => {
          onOpenChange(open)
          if (!open) reset()
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl p-0 gap-0">
          {/* Header */}
          <div className="p-5 border-b bg-card space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <DialogTitle className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5">
                  {order.order_number}
                  <button
                    type="button"
                    onClick={handleCopyOrderNumber}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="Copy Order Number"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </DialogTitle>
                <OrderStatusBadge status={order.status} />
                {order.is_out_of_zone ? (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold gap-1 text-[11px]">
                    🟡 Out of Zone
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px]">
                    Standard Zone
                  </Badge>
                )}
              </div>

              {/* Print Receipt / KOT Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrintOpen(true)}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Printer className="size-3.5" />
                Print KOT / Bill
              </Button>
            </div>

            <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Placed {dayjs(order.placed_at).format('D MMM YYYY, h:mm A')}</span>
              <span>•</span>
              <span>Customer: <strong className="text-foreground font-medium">{order.contact_name}</strong></span>
              {order.meal_type && (
                <>
                  <span>•</span>
                  <span className="capitalize font-semibold text-primary">
                    {order.meal_type === 'dinner' ? '🌙 Dinner' : '☀️ Lunch'}
                  </span>
                </>
              )}
            </DialogDescription>
          </div>

          <div className="p-5 space-y-5">
            {/* Customer & Delivery Card */}
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    {order.contact_name}
                    {order.contact_phone && (
                      <span className="text-xs text-muted-foreground font-mono font-normal">
                        ({order.contact_phone})
                      </span>
                    )}
                  </h4>
                  {order.zone_label && (
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3" /> Zone: {order.zone_label}
                    </p>
                  )}
                </div>

                {/* Quick Call & WhatsApp Action Buttons */}
                <div className="flex items-center gap-2">
                  {order.contact_phone && (
                    <>
                      <a
                        href={`tel:${order.contact_phone}`}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-background border hover:bg-muted text-foreground transition-colors"
                      >
                        <Phone className="size-3 text-primary" />
                        Call
                      </a>
                      <a
                        href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                          `Hello ${order.contact_name}, this is FoodIQ regarding your order #${order.order_number}.`,
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <MessageCircle className="size-3 text-emerald-600" />
                        WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery Address & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground font-medium block mb-0.5">Delivery Address:</span>
                  {fullAddress ? (
                    <div className="space-y-1">
                      <p className="text-foreground leading-relaxed font-normal">{fullAddress}</p>
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-[11px]"
                      >
                        <ExternalLink className="size-2.5" />
                        Open in Google Maps
                      </a>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">No delivery address provided</p>
                  )}
                </div>

                <div className="space-y-2">
                  {order.preferred_lunch_time && (
                    <div>
                      <span className="text-muted-foreground font-medium block mb-0.5">Preferred Meal Time:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-xs">
                        <Clock className="size-3" />
                        {order.preferred_lunch_time}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-muted-foreground font-medium block mb-0.5">Payment Status:</span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted font-medium text-xs">
                      <span className="capitalize">{order.payment_method || 'CASH'}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className={order.payment_status === 'paid' ? 'text-emerald-600 font-semibold uppercase' : 'text-amber-600 font-semibold capitalize'}>
                        {order.payment_status || 'Pending'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Out-of-Zone Charge Adjustment Panel (High Priority!) */}
            {order.is_out_of_zone && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 dark:text-amber-300 text-xs uppercase tracking-wide flex items-center gap-1.5">
                    🟡 Out of Standard Zone (Action Required)
                  </span>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 text-[10px]">
                    Current Charge: {CURRENCY_SYMBOL}{order.delivery_charge}
                  </Badge>
                </div>

                <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                  Customer requested delivery outside standard zones. Please set or adjust the custom delivery charge below:
                </p>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground mr-1">Quick Presets:</span>
                  {[30, 40, 50, 60, 80, 100].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCustomCharge(amt)}
                      className={`px-2 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                        customCharge === amt
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      +{CURRENCY_SYMBOL}{amt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative">
                    <span className="text-xs text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 font-medium">
                      {CURRENCY_SYMBOL}
                    </span>
                    <Input
                      type="number"
                      value={customCharge}
                      onChange={(e) => setCustomCharge(Number(e.target.value))}
                      className="w-32 h-9 pl-6 text-xs font-mono font-bold"
                      placeholder="Charge"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                    onClick={handleUpdateCharge}
                    disabled={updateCharge.isPending}
                  >
                    {updateCharge.isPending ? 'Saving...' : 'Set Charge & Update Total'}
                  </Button>
                </div>
              </div>
            )}

            {/* ORDER ITEMS BREAKDOWN (REDESIGNED & HIGHLIGHTED) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <UtensilsCrossed className="size-4 text-primary" />
                  Ordered Items & Meal Components ({parsedItems.length})
                </h4>
              </div>

              <div className="space-y-3">
                {parsedItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="rounded-xl border bg-card p-4 space-y-3 shadow-2xs hover:border-primary/40 transition-colors"
                  >
                    {/* Item Title, Category & Price */}
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-bold text-sm text-foreground">
                            {item.itemName}
                          </h5>
                          <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            × {item.quantity}
                          </span>
                          {/* Variant Badge */}
                          {item.variantName && item.variantName !== 'Standard' && (
                            <Badge variant="outline" className="text-[11px] font-semibold bg-muted/60 text-foreground">
                              {item.variantName}
                            </Badge>
                          )}
                          {/* Category Badge */}
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {item.categoryKind === 'meal' ? '🍱 Meal / Thali' : item.categoryKind}
                          </Badge>
                          {/* Bread breakdown badge for meals */}
                          {item.categoryKind === 'meal' && (
                            <Badge variant="outline" className="text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 gap-1">
                              <Wheat className="size-2.5 text-amber-600" />
                              {item.totalBreadCount} pcs {item.breadType === 'bhakhri' ? 'Bhakhri' : 'Rotli'}
                              {item.addonBreadCount > 0 ? ` (${item.baseBreadCount} base + ${item.addonBreadCount} extra)` : ''}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm font-mono">
                          {CURRENCY_SYMBOL}{item.lineTotal}
                        </span>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {CURRENCY_SYMBOL}{item.unitPrice} each
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Breakdown of Meal Components (Breads, Sabji, Dal) */}
                    {item.components.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                          Included Meal Components:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {item.components.map((comp, cIdx) => {
                            let icon = '•'
                            let badgeStyle = 'bg-muted/70 text-foreground border-border'
                            if (comp.categoryType === 'bread') {
                              icon = '🍞'
                              badgeStyle = 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 font-medium'
                            } else if (comp.categoryType === 'sabji') {
                              icon = '🍲'
                              badgeStyle = 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 font-medium'
                            } else if (comp.categoryType === 'rice_dal') {
                              icon = '🍚'
                              badgeStyle = 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border-blue-500/20'
                            } else if (comp.categoryType === 'farsan') {
                              icon = '🥟'
                              badgeStyle = 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border-orange-500/20'
                            } else if (comp.categoryType === 'sweet') {
                              icon = '🍬'
                              badgeStyle = 'bg-pink-500/10 text-pink-800 dark:text-pink-300 border-pink-500/20'
                            }
                            return (
                              <span
                                key={cIdx}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${badgeStyle}`}
                              >
                                <span>{icon}</span>
                                <span>
                                  {comp.categoryType === 'bread' && comp.quantity && comp.quantity > 1
                                    ? `${comp.name} (${comp.quantity} pcs)`
                                    : comp.name}
                                </span>
                                {comp.categoryType !== 'bread' && comp.quantity && comp.quantity > 1 && (
                                  <span className="font-mono font-bold">({comp.quantity})</span>
                                )}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Extra Add-ons (Rotli, Sabji, etc.) */}
                    {item.addons.length > 0 && (
                      <div className="space-y-1.5 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/20">
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                          + Custom Add-ons & Extras:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {item.addons.map((add, aIdx) => (
                            <span
                              key={aIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                            >
                              <span>+{add.name}</span>
                              {add.priceDelta > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                                  ({CURRENCY_SYMBOL}{add.priceDelta})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Item-level Special Instructions */}
                    {item.specialInstructions && (
                      <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span>Kitchen Note: "{item.specialInstructions}"</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Kitchen Packing & Cook Summary for THIS Order */}
            {orderProduction && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wide text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <ChefHat className="size-4 text-amber-600" />
                    Kitchen Pack & Prep Summary
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-amber-500/30">
                    {orderProduction.totalMeals} {orderProduction.totalMeals === 1 ? 'Meal' : 'Meals'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  {/* Breads */}
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/60 space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Wheat className="size-3 text-amber-600" /> Breads to Pack
                    </span>
                    <p className="font-mono font-bold text-sm text-foreground">
                      {orderProduction.breads.totalAllBreads} pcs
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {orderProduction.breads.rotli.total > 0 && `${orderProduction.breads.rotli.total} Rotli`}
                      {orderProduction.breads.rotli.total > 0 && orderProduction.breads.bhakhri.total > 0 && ' · '}
                      {orderProduction.breads.bhakhri.total > 0 && `${orderProduction.breads.bhakhri.total} Bhakhri`}
                    </p>
                  </div>

                  {/* Sabjis */}
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/60 space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Soup className="size-3 text-emerald-600" /> Sabji Portions
                    </span>
                    <p className="font-mono font-bold text-sm text-foreground">
                      {orderProduction.totalSabjiPortions} bowls
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {Object.values(orderProduction.sabjis).map((s) => `${s.totalPortions} ${s.name}`).join(', ') || 'Standard'}
                    </p>
                  </div>

                  {/* Dal & Rice */}
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/60 space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      🍚 Dal & Rice
                    </span>
                    <p className="font-mono font-bold text-sm text-foreground">
                      {orderProduction.mealsWithDalRice > 0
                        ? `${orderProduction.mealsWithDalRice} Dal-Bhat`
                        : Object.keys(orderProduction.dalKadhiRice).length > 0
                        ? `${Object.values(orderProduction.dalKadhiRice).reduce((a, b) => a + b.portions, 0)} bowls`
                        : 'None'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {orderProduction.mealsWithDalRice > 0 ? 'Classic / Deluxe' : 'Regular/Prem Thali'}
                    </p>
                  </div>

                  {/* Packaging */}
                  <div className="bg-background/80 p-2.5 rounded-lg border border-border/60 space-y-0.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase flex items-center gap-1">
                      <Package className="size-3 text-primary" /> Packaging Unit
                    </span>
                    <p className="font-mono font-bold text-sm text-foreground">
                      {orderProduction.packaging.totalPackages} boxes
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {orderProduction.packaging.regular5CpTrays > 0 && `${orderProduction.packaging.regular5CpTrays}× 5-CP`}
                      {orderProduction.packaging.premium8CpTrays > 0 && ` · ${orderProduction.packaging.premium8CpTrays}× 8-CP`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Overall Order Special Instructions */}
            {order.special_instructions && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" />
                  Customer Note / Cooking Instructions:
                </span>
                <p className="text-xs text-foreground font-medium italic">
                  "{order.special_instructions}"
                </p>
              </div>
            )}

            {/* Price & Billing Summary */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Items Subtotal</span>
                <span className="font-mono font-medium">{CURRENCY_SYMBOL}{order.subtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  Delivery Fee
                  {order.is_out_of_zone && (
                    <span className="text-[10px] text-amber-600 font-semibold">(Out of Zone)</span>
                  )}
                </span>
                <span className="font-mono font-medium">{CURRENCY_SYMBOL}{order.delivery_charge}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span className="font-mono">-{CURRENCY_SYMBOL}{order.discount_amount}</span>
                </div>
              )}
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span className="font-mono font-medium">{CURRENCY_SYMBOL}{order.tax_amount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t text-foreground">
                <span>Total Amount</span>
                <span className="font-mono text-primary font-extrabold">
                  {CURRENCY_SYMBOL}{order.total_amount}
                </span>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="rounded-xl border p-4 bg-card">
              <h5 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
                Order Lifecycle Timeline
              </h5>
              <OrderStatusTimeline status={order.status} />
            </div>

            {/* Rejection / Cancellation Reason Form */}
            {showReject || showCancel ? (
              <div className="space-y-2 border-t pt-3">
                <p className="font-semibold text-sm text-destructive">
                  {showReject ? 'Reject Order' : 'Cancel Order'}
                </p>
                <Textarea
                  placeholder={showReject ? 'Reason for rejecting (optional)' : 'Reason for cancelling (optional)'}
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            ) : null}
          </div>

          {/* Dialog Footer Actions */}
          <DialogFooter className="p-4 border-t bg-card flex-wrap gap-2 sm:justify-between">
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
                  Confirm {showReject ? 'Rejection' : 'Cancellation'}
                </Button>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  {order.status === 'pending' ? (
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setShowReject(true)}>
                      Reject Order
                    </Button>
                  ) : canCancel ? (
                    <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => setShowCancel(true)}>
                      Cancel Order
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {order.status === 'pending' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 text-xs"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'accepted' })}
                      >
                        Accept Only
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 h-9 gap-1.5"
                        disabled={updateStatus.isPending}
                        onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}
                      >
                        <CheckCircle2 className="size-4" />
                        Accept & Deliver ✓
                      </Button>
                    </>
                  ) : ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(order.status) ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 h-9 gap-1.5"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: order.id, status: 'delivered' })}
                    >
                      <CheckCircle2 className="size-4" />
                      Mark as Delivered ✓
                    </Button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      Order Complete ({order.status})
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Slip Dialog */}
      <OrderPrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        order={order}
      />
    </>
  )
}
