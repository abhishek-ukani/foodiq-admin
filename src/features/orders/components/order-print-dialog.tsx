import { useState } from 'react'
import { Printer, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AdminOrder } from '@/features/orders/services/orders-service'
import { parseOrderItemDetails } from '@/features/orders/utils/order-parser'
import { CURRENCY_SYMBOL } from '@/constants'
import dayjs from 'dayjs'

interface OrderPrintDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: AdminOrder | null
}

export function OrderPrintDialog({
  open,
  onOpenChange,
  order,
}: OrderPrintDialogProps) {
  const [printMode, setPrintMode] = useState<'kot' | 'bill'>('kot')

  if (!order) return null

  const parsedItems = (order.order_items || []).map((item) => parseOrderItemDetails(item))

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md p-4 space-y-4">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
          <div>
            <DialogTitle className="text-base font-bold">Print Order Document</DialogTitle>
            <p className="text-xs text-muted-foreground">Thermal 80mm printer standard</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handlePrint} className="gap-1.5 h-8 text-xs bg-primary">
              <Printer className="size-3.5" />
              Print Now
            </Button>
          </div>
        </DialogHeader>

        {/* Switch between Kitchen KOT and Customer Bill */}
        <Tabs value={printMode} onValueChange={(v) => setPrintMode(v as 'kot' | 'bill')} className="w-full">
          <TabsList className="grid grid-cols-2 h-9">
            <TabsTrigger value="kot" className="text-xs">
              👨‍🍳 Kitchen KOT Slip
            </TabsTrigger>
            <TabsTrigger value="bill" className="text-xs">
              🧾 Delivery Bill / Receipt
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Thermal Slip Simulation Container */}
        <div className="bg-white text-black p-5 rounded-md border font-mono text-xs shadow-inner space-y-3 leading-relaxed print:p-0 print:border-none print:shadow-none print:w-full">
          {/* Header */}
          <div className="text-center border-b border-dashed border-neutral-400 pb-2">
            <h2 className="text-base font-extrabold tracking-wider">FOODIQ</h2>
            <p className="text-[11px] font-sans font-medium text-neutral-600">Fresh Daily Meals & Farsan</p>
            <div className="mt-1 pt-1 border-t border-dotted border-neutral-300 font-bold text-sm">
              {printMode === 'kot' ? '--- KITCHEN ORDER TICKET (KOT) ---' : '--- DELIVERY INVOICE ---'}
            </div>
          </div>

          {/* Meta Info */}
          <div className="text-[11px] space-y-0.5 border-b border-dashed border-neutral-400 pb-2">
            <div className="flex justify-between font-bold text-xs">
              <span>Order #: {order.order_number}</span>
              <span className="capitalize">{order.meal_type || 'Lunch'}</span>
            </div>
            <div>Date: {dayjs(order.placed_at).format('DD/MM/YYYY hh:mm A')}</div>
            <div>Customer: {order.contact_name}</div>
            <div>Phone: {order.contact_phone || 'N/A'}</div>
            {printMode === 'bill' && order.address_line1 && (
              <div className="mt-1">
                Address: {order.address_line1}{order.address_line2 ? `, ${order.address_line2}` : ''}
                {order.landmark ? ` (Near ${order.landmark})` : ''}, {order.city} - {order.pincode}
              </div>
            )}
            {order.zone_label && (
              <div className="font-semibold">
                Zone: {order.zone_label} {order.is_out_of_zone ? '(OUT OF ZONE)' : ''}
              </div>
            )}
            {order.preferred_lunch_time && (
              <div className="font-bold text-neutral-900">
                Pref Time: {order.preferred_lunch_time}
              </div>
            )}
          </div>

          {/* Items Section */}
          <div className="space-y-2 border-b border-dashed border-neutral-400 pb-2">
            <div className="flex justify-between font-bold border-b border-neutral-300 pb-1 text-[11px]">
              <span>ITEM & INGREDIENTS</span>
              <span className="text-right">{printMode === 'bill' ? 'QTY · AMT' : 'QTY'}</span>
            </div>

            {parsedItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between font-bold text-xs">
                  <span>
                    {item.itemName}
                    {item.variantName && item.variantName !== 'Standard' && ` (${item.variantName})`}
                  </span>
                  <span>
                    {item.quantity} {printMode === 'bill' ? `· ${CURRENCY_SYMBOL}${item.lineTotal}` : ''}
                  </span>
                </div>

                {/* Breakdown of Thali components (Rotli, Sabji, Dal) */}
                {item.components.length > 0 && (
                  <div className="text-[10px] text-neutral-700 pl-2">
                    {item.components
                      .map((c) =>
                        c.categoryType === 'bread' && c.quantity && c.quantity > 1
                          ? `${c.quantity}× ${c.name}`
                          : c.name,
                      )
                      .join(' + ')}
                  </div>
                )}

                {/* Add-ons */}
                {item.addons.length > 0 && (
                  <div className="text-[11px] font-semibold text-neutral-900 pl-2">
                    {item.addons.map((a) => `+ ${a.name}`).join(', ')}
                  </div>
                )}

                {/* Special Instructions */}
                {item.specialInstructions && (
                  <div className="text-[10px] italic font-bold bg-neutral-100 p-1 rounded mt-0.5">
                    Note: "{item.specialInstructions}"
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Customer Special Notes on Order */}
          {order.special_instructions && (
            <div className="border-b border-dashed border-neutral-400 pb-2 bg-neutral-100 p-1.5 rounded">
              <span className="font-bold text-[11px]">KITCHEN INSTRUCTION:</span>
              <p className="text-[11px] font-bold mt-0.5">"{order.special_instructions}"</p>
            </div>
          )}

          {/* Financials (Only in Bill mode, or brief summary in KOT) */}
          {printMode === 'bill' ? (
            <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-400 pb-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{CURRENCY_SYMBOL}{order.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{CURRENCY_SYMBOL}{order.delivery_charge}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-{CURRENCY_SYMBOL}{order.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm border-t border-neutral-300 pt-1">
                <span>TOTAL:</span>
                <span>{CURRENCY_SYMBOL}{order.total_amount}</span>
              </div>
              <div className="flex justify-between font-semibold pt-0.5">
                <span>Payment:</span>
                <span className="uppercase">
                  {order.payment_method || 'CASH'} ({order.payment_status || 'PENDING'})
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-bold flex justify-between border-b border-dashed border-neutral-400 pb-2">
              <span>Payment Type:</span>
              <span className="uppercase">{order.payment_method || 'CASH'} - {order.payment_status || 'PENDING'}</span>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-[10px] text-neutral-500 pt-1">
            <p>Thank you for choosing FoodIQ!</p>
            <p>Support: +91 92658 32715</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
