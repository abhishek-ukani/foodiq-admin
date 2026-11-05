import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Plus,
  ReceiptText,
  ShoppingBag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useCustomer,
  useCustomerAddresses,
  useCustomerOrders,
  useSetCustomerActive,
  useSetCustomerBillingCycle,
} from '@/features/customers/hooks/use-customers'
import {
  CollectPaymentDialog,
  type OrderToCollect,
} from '@/features/customers/components/collect-payment-dialog'
import { CreateOrderDialog } from '@/features/orders/components/create-order-dialog'
import { CURRENCY_SYMBOL } from '@/constants'
import type { Tables } from '@/types/database.types'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { data: customer, isPending } = useCustomer(id)
  const { data: orders, isPending: ordersPending } = useCustomerOrders(id)
  const { data: addresses } = useCustomerAddresses(id)
  const setActive = useSetCustomerActive()
  const setBillingCycle = useSetCustomerBillingCycle()

  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [orderFilter, setOrderFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])

  const [collectDialogState, setCollectDialogState] = useState<{
    open: boolean
    orders: OrderToCollect[]
  }>({
    open: false,
    orders: [],
  })

  const validOrders = useMemo(() => {
    return (orders || []).filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
  }, [orders])

  const unpaidOrders = useMemo(() => {
    return validOrders.filter((o) => o.payment_status !== 'paid')
  }, [validOrders])

  const paidOrders = useMemo(() => {
    return validOrders.filter((o) => o.payment_status === 'paid')
  }, [validOrders])

  const displayedOrders = useMemo(() => {
    if (orderFilter === 'unpaid') return unpaidOrders
    if (orderFilter === 'paid') return paidOrders
    return orders || []
  }, [orders, orderFilter, unpaidOrders, paidOrders])

  const totalOrdersCount = orders ? validOrders.length : (customer?.total_orders ?? 0)
  const totalSpentAmount = orders
    ? validOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    : (customer?.total_spent ?? 0)

  const pendingDuesAmount = useMemo(() => {
    return unpaidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  }, [unpaidOrders])

  const selectedOrdersToCollect = useMemo<OrderToCollect[]>(() => {
    return unpaidOrders
      .filter((o) => selectedOrderIds.includes(o.id))
      .map((o) => ({
        id: o.id,
        order_number: o.order_number,
        total_amount: Number(o.total_amount || 0),
        placed_at: o.placed_at,
        delivery_date: o.delivery_date,
      }))
  }, [unpaidOrders, selectedOrderIds])

  const selectedTotalAmount = useMemo(() => {
    return selectedOrdersToCollect.reduce((sum, o) => sum + o.total_amount, 0)
  }, [selectedOrdersToCollect])

  const isAllUnpaidSelected =
    unpaidOrders.length > 0 && selectedOrderIds.length === unpaidOrders.length

  const toggleSelectAllUnpaid = () => {
    if (isAllUnpaidSelected) {
      setSelectedOrderIds([])
    } else {
      setSelectedOrderIds(unpaidOrders.map((o) => o.id))
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId],
    )
  }

  const handleCollectSingle = (order: Tables<'orders'>) => {
    setCollectDialogState({
      open: true,
      orders: [
        {
          id: order.id,
          order_number: order.order_number,
          total_amount: Number(order.total_amount || 0),
          placed_at: order.placed_at,
          delivery_date: order.delivery_date,
        },
      ],
    })
  }

  const handleCollectSelected = () => {
    if (!selectedOrdersToCollect.length) return
    setCollectDialogState({
      open: true,
      orders: selectedOrdersToCollect,
    })
  }

  const handleCollectAllUnpaid = () => {
    if (!unpaidOrders.length) return
    setCollectDialogState({
      open: true,
      orders: unpaidOrders.map((o) => ({
        id: o.id,
        order_number: o.order_number,
        total_amount: Number(o.total_amount || 0),
        placed_at: o.placed_at,
        delivery_date: o.delivery_date,
      })),
    })
  }

  if (isPending) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (!customer) return null

  return (
    <div className="space-y-6">
      {/* ── Profile Header Card ── */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">
                {(customer.full_name ?? customer.email ?? '?')[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-semibold">{customer.full_name ?? 'Unnamed'}</h1>

                {/* Billing Cycle Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border border-border/80 bg-muted/40 hover:bg-muted text-muted-foreground transition-colors"
                      title="Click to change payment cycle"
                    >
                      <Calendar className="size-3" />
                      <span>{customer.billing_cycle || 'weekly'} cycle</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Customer Billing Cycle</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setBillingCycle.mutate({ customerId: customer.id, cycle: 'daily' })}
                    >
                      Daily (Settles after each meal)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setBillingCycle.mutate({ customerId: customer.id, cycle: 'weekly' })}
                    >
                      Weekly (Settles weekly tab)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setBillingCycle.mutate({ customerId: customer.id, cycle: 'monthly' })}
                    >
                      Monthly (Settles monthly bill)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" aria-hidden />
                  {customer.email}
                </span>
                {customer.phone ? (
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" aria-hidden />
                    {customer.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {pendingDuesAmount > 0 && (
              <Button
                variant="default"
                onClick={handleCollectAllUnpaid}
                className="gap-2 bg-amber-600 hover:bg-amber-700 text-white min-h-[44px]"
              >
                <ReceiptText className="size-4" />
                Collect All Dues ({CURRENCY_SYMBOL}
                {pendingDuesAmount.toLocaleString('en-IN')})
              </Button>
            )}

            <Button onClick={() => setCreateOrderOpen(true)} variant="outline" className="gap-2 min-h-[44px]">
              <ShoppingBag className="size-4" />
              Place Order
            </Button>

            <div className="flex items-center gap-2 border-l pl-3 ml-1">
              <span className="text-xs text-muted-foreground">
                {customer.is_active ? 'Active' : 'Inactive'}
              </span>
              <Switch
                checked={customer.is_active}
                onCheckedChange={(checked) => setActive.mutate({ id: customer.id, is_active: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 4 KPI Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">
              Total Orders
            </p>
            <p className="text-2xl font-bold mt-1">{totalOrdersCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">
              Total Spent
            </p>
            <p className="text-2xl font-bold mt-1">
              {CURRENCY_SYMBOL}
              {totalSpentAmount.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        <Card
          className={
            pendingDuesAmount > 0
              ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background'
              : ''
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p
                className={`text-xs uppercase font-semibold tracking-wider ${
                  pendingDuesAmount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
                }`}
              >
                Pending Dues (Khata)
              </p>
              {pendingDuesAmount > 0 && <AlertCircle className="size-4 text-amber-600" />}
            </div>
            <p
              className={`text-2xl font-bold mt-1 ${
                pendingDuesAmount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
              }`}
            >
              {CURRENCY_SYMBOL}
              {pendingDuesAmount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {unpaidOrders.length} unpaid {unpaidOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-xs uppercase font-semibold tracking-wider">
              Customer Since
            </p>
            <p className="text-2xl font-bold mt-1">{dayjs(customer.created_at).format('MMM YYYY')}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Saved Addresses ── */}
      {addresses?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved Addresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="flex items-start gap-2 text-sm">
                <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                <span>
                  <span className="font-medium capitalize">{address.label}: </span>
                  {address.address_line1}, {address.city}, {address.pincode}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Order History & Khata Payment Ledger ── */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">Order History & Payment Ledger</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select unpaid orders to collect payment in bulk or mark them individually.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setCreateOrderOpen(true)} className="gap-1.5">
              <Plus className="size-3.5" />
              New Order
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sub-Tabs: All / Unpaid / Paid */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={orderFilter === 'all' ? 'default' : 'ghost'}
                className="h-8 text-xs rounded-full"
                onClick={() => setOrderFilter('all')}
              >
                All Orders ({orders?.length ?? 0})
              </Button>
              <Button
                size="sm"
                variant={orderFilter === 'unpaid' ? 'default' : 'ghost'}
                className={`h-8 text-xs rounded-full ${
                  orderFilter !== 'unpaid' && unpaidOrders.length > 0
                    ? 'text-amber-700 dark:text-amber-400 font-semibold'
                    : ''
                }`}
                onClick={() => setOrderFilter('unpaid')}
              >
                Pending Dues ({unpaidOrders.length})
              </Button>
              <Button
                size="sm"
                variant={orderFilter === 'paid' ? 'default' : 'ghost'}
                className="h-8 text-xs rounded-full"
                onClick={() => setOrderFilter('paid')}
              >
                Paid ({paidOrders.length})
              </Button>
            </div>

            {/* Select All Checkbox for Unpaid Orders */}
            {unpaidOrders.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleSelectAllUnpaid}
                  className="h-7 text-xs gap-1.5"
                >
                  <Checkbox checked={isAllUnpaidSelected} />
                  <span>{isAllUnpaidSelected ? 'Deselect All' : 'Select All Unpaid'}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Sticky / Highlighted Bulk Settlement Action Bar */}
          {selectedOrderIds.length > 0 && (
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 flex flex-wrap items-center justify-between gap-3 animate-in fade-in-50 duration-200">
              <div className="flex items-center gap-2">
                <ReceiptText className="size-5 text-primary" />
                <div>
                  <span className="font-semibold text-sm">
                    {selectedOrderIds.length} {selectedOrderIds.length === 1 ? 'order' : 'orders'} selected
                  </span>
                  <span className="text-xs text-muted-foreground block">
                    Total Amount:{' '}
                    <strong className="text-foreground">
                      {CURRENCY_SYMBOL}
                      {selectedTotalAmount.toLocaleString('en-IN')}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedOrderIds([])}
                  className="text-xs h-9"
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={handleCollectSelected}
                  className="gap-1.5 min-h-[38px] text-xs font-semibold shadow-sm"
                >
                  <Check className="size-4" />
                  Collect Payment ({CURRENCY_SYMBOL}
                  {selectedTotalAmount.toLocaleString('en-IN')})
                </Button>
              </div>
            </div>
          )}

          {/* Orders List */}
          {ordersPending ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : !displayedOrders.length ? (
            <EmptyState
              icon={PackageSearch}
              title={
                orderFilter === 'unpaid'
                  ? 'All settled! No pending dues.'
                  : orderFilter === 'paid'
                  ? 'No paid orders yet.'
                  : 'No orders yet.'
              }
              className="border-none py-8"
            />
          ) : (
            <div className="divide-y divide-border/60">
              {displayedOrders.map((order) => {
                const isUnpaid =
                  order.status !== 'cancelled' &&
                  order.status !== 'rejected' &&
                  order.payment_status !== 'paid'
                const isSelected = selectedOrderIds.includes(order.id)

                return (
                  <div
                    key={order.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-3.5 transition-colors ${
                      isSelected ? 'bg-primary/5 -mx-2 px-2 rounded-lg' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isUnpaid ? (
                        <div className="pt-0.5">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                            aria-label={`Select order ${order.order_number}`}
                          />
                        </div>
                      ) : (
                        <div className="size-4 shrink-0 mt-0.5" />
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-foreground">{order.order_number}</p>
                          <OrderStatusBadge status={order.status} />
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {dayjs(order.delivery_date || order.placed_at).format('D MMM YYYY, h:mm A')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0">
                      {/* Payment Status Pill */}
                      {order.payment_status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="size-3" />
                          <span>Paid ({order.payment_method?.toUpperCase() || 'CASH'})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="size-3" />
                          <span>Unpaid Dues</span>
                        </span>
                      )}

                      {/* Total Amount */}
                      <p className="font-bold text-sm min-w-16 text-right text-foreground">
                        {CURRENCY_SYMBOL}
                        {Number(order.total_amount || 0).toLocaleString('en-IN')}
                      </p>

                      {/* Quick "Mark Paid" button on row */}
                      {isUnpaid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCollectSingle(order)}
                          className="h-8 px-2.5 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1"
                        >
                          <ReceiptText className="size-3.5" />
                          <span>Mark Paid</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Place Order Modal ── */}
      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        preselectedCustomerId={id}
      />

      {/* ── Collect Payment Modal ── */}
      <CollectPaymentDialog
        open={collectDialogState.open}
        onOpenChange={(open) => setCollectDialogState((prev) => ({ ...prev, open }))}
        customerName={customer.full_name}
        customerPhone={customer.phone}
        orders={collectDialogState.orders}
        onSuccess={() => setSelectedOrderIds([])}
      />
    </div>
  )
}
