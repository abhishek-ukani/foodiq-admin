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
  ShieldCheck,
  Zap,
  ShoppingBag,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  useSetAddressRouteApproved,
  useSetCustomerActive,
  useSetCustomerBillingCycle,
  useSetCustomerSubscriptionEligible,
  useSetCustomerVerified,
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
  const setSubEligible = useSetCustomerSubscriptionEligible()
  const setVerified = useSetCustomerVerified()
  const setRouteApproved = useSetAddressRouteApproved()

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

      {/* ── Customer Trust & Auto-Accept Controls ── */}
      <Card className="border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Verification & Auto-Accept Controls
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Manage order intake rules for this customer. Auto-acceptance triggers when both this toggle and the delivery address are approved.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {/* Identity Verification */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Identity Verification</span>
                {customer.is_verified ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium">
                    ✓ Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 font-semibold">
                    ⚠️ Needs Verification
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Confirm phone number and trust profile. Unverified customer orders require staff phone verification.
              </p>
            </div>
            <Switch
              checked={Boolean(customer.is_verified)}
              onCheckedChange={(checked) => setVerified.mutate({ id: customer.id, is_verified: checked })}
            />
          </div>

          {/* Auto-Accept Daily Orders */}
          <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold flex items-center gap-1">
                  <Zap className="size-3.5 text-purple-600 dark:text-purple-400" />
                  Auto-Accept Daily Orders
                </span>
                {customer.is_subscription_eligible ? (
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-medium">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    Manual Review
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, daily lunch/dinner orders to route-approved addresses bypass pending and enter kitchen instantly (within bulk caps).
              </p>
            </div>
            <Switch
              checked={Boolean(customer.is_subscription_eligible)}
              onCheckedChange={(checked) =>
                setSubEligible.mutate({ id: customer.id, is_subscription_eligible: checked })
              }
            />
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

      {/* ── Saved Delivery Addresses & Route Approval ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                Delivery Addresses & Route Approvals
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Approve specific corridor addresses for instant auto-acceptance. Any address update by the customer resets approval for safety.
              </p>
            </div>
            <Badge variant="outline" className="w-fit text-xs font-normal">
              {addresses?.length ?? 0} {addresses?.length === 1 ? 'address' : 'addresses'} saved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!addresses?.length ? (
            <div className="py-6 text-center text-sm text-muted-foreground border border-dashed rounded-xl space-y-1">
              <p>No standalone addresses saved in customer address book.</p>
              {orders?.[0]?.address_line1 && (
                <p className="text-xs text-muted-foreground/80">
                  Last order delivered to: <span className="font-medium text-foreground">{orders[0].address_line1}, {orders[0].city} - {orders[0].pincode}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {addresses.map((address) => {
                const isApproved = Boolean(address.is_route_approved)
                return (
                  <div
                    key={address.id}
                    className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                      isApproved
                        ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                        : 'border-border/70 bg-card'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm capitalize">{address.label}</span>
                          {address.is_default && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Default
                            </Badge>
                          )}
                          {address.meal_type_tag && (
                            <Badge variant="outline" className="text-[10px] capitalize px-1.5 py-0">
                              {address.meal_type_tag}
                            </Badge>
                          )}
                          {address.preferred_time && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
                              {address.preferred_time}
                            </Badge>
                          )}
                        </div>

                        {isApproved ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium"
                          >
                            ✓ Route Approved
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-medium"
                          >
                            ⚠️ Unapproved Route
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p className="text-foreground font-medium">{address.address_line1}</p>
                        {address.address_line2 && <p>{address.address_line2}</p>}
                        {address.landmark && (
                          <p>
                            <span className="text-muted-foreground/80">Landmark:</span> {address.landmark}
                          </p>
                        )}
                        {address.sublocality && (
                          <p>
                            <span className="text-muted-foreground/80">Area:</span> {address.sublocality}
                          </p>
                        )}
                        <p>
                          {address.city} - {address.pincode}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium">Route Approval</p>
                        <p className="text-[11px] text-muted-foreground">
                          {isApproved ? 'Auto-accept enabled for this location' : 'Orders require kitchen approval'}
                        </p>
                      </div>
                      <Switch
                        checked={isApproved}
                        onCheckedChange={(checked) =>
                          setRouteApproved.mutate({
                            addressId: address.id,
                            is_route_approved: checked,
                            customerId: customer.id,
                          })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
