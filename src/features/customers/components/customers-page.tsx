import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  MoreHorizontal,
  ReceiptText,
  Search,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/data-table/data-table'
import {
  useCustomers,
  useReceivablesSummary,
  useSetCustomerActive,
  useSetCustomerBillingCycle,
  useSetCustomerSubscriptionEligible,
} from '@/features/customers/hooks/use-customers'
import {
  type CustomerWithKhata,
  fetchCustomerOrders,
} from '@/features/customers/services/customers-service'
import {
  CollectPaymentDialog,
  type OrderToCollect,
} from '@/features/customers/components/collect-payment-dialog'
import { CreateOrderDialog } from '@/features/orders/components/create-order-dialog'
import { downloadCsv } from '@/lib/csv-export'
import { ADMIN_ROUTES, CURRENCY_SYMBOL } from '@/constants'

function exportCustomersCsv(rows: CustomerWithKhata[]) {
  downloadCsv(
    `customers-khata-${dayjs().format('YYYY-MM-DD')}.csv`,
    ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Pending Dues', 'Unpaid Orders', 'Billing Cycle', 'Status'],
    rows.map((c) => [
      c.full_name ?? '',
      c.email ?? '',
      c.phone ?? '',
      c.total_orders,
      c.total_spent,
      c.pending_balance,
      c.pending_orders_count,
      c.billing_cycle,
      c.is_active ? 'Active' : 'Inactive',
    ]),
  )
}

export function CustomersPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: customers, isPending } = useCustomers()
  const { data: receivables } = useReceivablesSummary()
  const setActive = useSetCustomerActive()
  const setSubEligible = useSetCustomerSubscriptionEligible()
  const setBillingCycle = useSetCustomerBillingCycle()

  const [search, setSearch] = useState('')
  const activeCycleFilter = searchParams.get('cycle') || searchParams.get('filter') || 'all'

  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [orderCustomerId, setOrderCustomerId] = useState<string | undefined>()

  const [collectDialogState, setCollectDialogState] = useState<{
    open: boolean
    customerName: string
    customerPhone: string
    orders: OrderToCollect[]
  }>({
    open: false,
    customerName: '',
    customerPhone: '',
    orders: [],
  })

  const [isCollectingForCustomer, setIsCollectingForCustomer] = useState<string | null>(null)

  const handleQuickCollect = async (customer: CustomerWithKhata) => {
    setIsCollectingForCustomer(customer.id)
    try {
      const orders = await fetchCustomerOrders(customer.id)
      const unpaid = orders
        .filter((o) => o.status !== 'cancelled' && o.status !== 'rejected' && o.payment_status !== 'paid')
        .map((o) => ({
          id: o.id,
          order_number: o.order_number,
          total_amount: Number(o.total_amount || 0),
          placed_at: o.placed_at,
          delivery_date: o.delivery_date,
        }))

      if (!unpaid.length) {
        toast.error('No unpaid orders found for this customer')
        return
      }

      setCollectDialogState({
        open: true,
        customerName: customer.full_name || 'Customer',
        customerPhone: customer.phone || '',
        orders: unpaid,
      })
    } catch (err: any) {
      toast.error('Failed to load orders: ' + err.message)
    } finally {
      setIsCollectingForCustomer(null)
    }
  }

  const filtered = useMemo(() => {
    if (!customers) return []
    let list = customers

    // 1. Billing Cycle / Dues Filter
    if (activeCycleFilter === 'pending' || activeCycleFilter === 'dues') {
      list = list.filter((c) => c.pending_balance > 0)
    } else if (activeCycleFilter === 'daily') {
      list = list.filter((c) => c.billing_cycle === 'daily')
    } else if (activeCycleFilter === 'weekly') {
      list = list.filter((c) => c.billing_cycle === 'weekly')
    } else if (activeCycleFilter === 'monthly') {
      list = list.filter((c) => c.billing_cycle === 'monthly')
    }

    // 2. Search query
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query),
    )
  }, [customers, search, activeCycleFilter])

  const columns = useMemo<ColumnDef<CustomerWithKhata>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Customer',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-9">
              <AvatarFallback>{(row.original.full_name ?? row.original.email ?? '?')[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">{row.original.full_name ?? 'Unnamed'}</p>
              <p className="text-muted-foreground text-xs">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">{row.original.phone || '—'}</span>
        ),
      },
      {
        accessorKey: 'billing_cycle',
        header: 'Billing Cycle',
        cell: ({ row }) => {
          const cycle = row.original.billing_cycle
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize transition-colors border border-border/70 hover:bg-muted"
                >
                  <Calendar className="size-3 text-muted-foreground" />
                  <span>{cycle}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Set Payment Schedule</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setBillingCycle.mutate({ customerId: row.original.id, cycle: 'daily' })
                  }}
                >
                  Daily (Pay after each meal)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setBillingCycle.mutate({ customerId: row.original.id, cycle: 'weekly' })
                  }}
                >
                  Weekly (Pay weekly sum)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setBillingCycle.mutate({ customerId: row.original.id, cycle: 'monthly' })
                  }}
                >
                  Monthly (Pay monthly bill)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
      {
        accessorKey: 'total_orders',
        header: 'Orders',
        cell: ({ row }) => <span className="font-medium">{row.original.total_orders}</span>,
      },
      {
        accessorKey: 'total_spent',
        header: 'Total Spent',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {CURRENCY_SYMBOL}
            {Number(row.original.total_spent || 0).toLocaleString('en-IN')}
          </span>
        ),
      },
      {
        accessorKey: 'pending_balance',
        header: 'Pending Due (Khata)',
        cell: ({ row }) => {
          const dues = row.original.pending_balance
          const unpaidCount = row.original.pending_orders_count

          if (dues <= 0) {
            return (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="size-3.5" />
                All Paid
              </span>
            )
          }

          return (
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <AlertCircle className="size-3" />
                {CURRENCY_SYMBOL}
                {dues.toLocaleString('en-IN')}
              </span>
              <p className="text-[11px] text-muted-foreground">
                {unpaidCount} {unpaidCount === 1 ? 'order' : 'orders'} unpaid
              </p>
            </div>
          )
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? 'secondary' : 'outline'}>
            {row.original.is_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const hasDues = row.original.pending_balance > 0
          return (
            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
              {hasDues && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs font-semibold border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1.5"
                  disabled={isCollectingForCustomer === row.original.id}
                  onClick={() => handleQuickCollect(row.original)}
                >
                  <ReceiptText className="size-3.5" />
                  <span>Collect</span>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Actions">
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {hasDues && (
                    <DropdownMenuItem onClick={() => handleQuickCollect(row.original)}>
                      <ReceiptText className="size-4 mr-2 text-amber-600" />
                      Collect Payment ({CURRENCY_SYMBOL}
                      {row.original.pending_balance})
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setOrderCustomerId(row.original.id)
                      setCreateOrderOpen(true)
                    }}
                  >
                    <ShoppingBag className="size-4 mr-2" />
                    Place Order
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(ADMIN_ROUTES.customerDetail(row.original.id))}>
                    View details & Khata
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setSubEligible.mutate({
                        id: row.original.id,
                        is_subscription_eligible: !row.original.is_subscription_eligible,
                      })
                    }
                  >
                    {row.original.is_subscription_eligible
                      ? 'Disable Subscriptions'
                      : 'Enable Subscriptions'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setActive.mutate({ id: row.original.id, is_active: !row.original.is_active })
                    }
                  >
                    {row.original.is_active ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [navigate, setActive, setSubEligible, setBillingCycle, isCollectingForCustomer],
  )

  const pendingCustomersCount = useMemo(() => {
    return customers ? customers.filter((c) => c.pending_balance > 0).length : 0
  }, [customers])

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customers & Khata Ledger</h1>
          <p className="text-muted-foreground text-sm">
            Manage customer accounts, billing cycles (daily/weekly/monthly), and collect order payments.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => customers && exportCustomersCsv(customers)}
          disabled={!customers?.length}
          className="gap-1.5"
        >
          <Download className="size-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      {/* ── Executive Receivables / Khata Summary Bar ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-background">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Total Pending Dues
              </span>
              <Wallet className="size-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {CURRENCY_SYMBOL}
              {(receivables?.total_pending_amount ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {receivables?.total_pending_orders ?? 0} unpaid orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Customers with Dues
              </span>
              <Users className="size-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {receivables?.total_customers_with_dues ?? pendingCustomersCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Accounts awaiting settlement</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weekly Aging Dues
              </span>
              <Calendar className="size-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {CURRENCY_SYMBOL}
              {(receivables?.weekly_pending_amount ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {receivables?.weekly_pending_orders ?? 0} orders within 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Monthly Aging Dues
              </span>
              <Clock className="size-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-foreground mt-2">
              {CURRENCY_SYMBOL}
              {(receivables?.monthly_pending_amount ?? 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {receivables?.monthly_pending_orders ?? 0} orders within 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Search and Quick Filters ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-9"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={activeCycleFilter === 'all' ? 'default' : 'outline'}
            className="text-xs rounded-full h-8"
            onClick={() => setSearchParams({})}
          >
            All Customers ({customers?.length ?? 0})
          </Button>

          <Button
            size="sm"
            variant={activeCycleFilter === 'pending' || activeCycleFilter === 'dues' ? 'default' : 'outline'}
            className={`text-xs rounded-full h-8 ${
              activeCycleFilter !== 'pending' && pendingCustomersCount > 0
                ? 'border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/5'
                : ''
            }`}
            onClick={() => setSearchParams({ filter: 'pending' })}
          >
            Has Pending Dues ({pendingCustomersCount})
          </Button>

          <Button
            size="sm"
            variant={activeCycleFilter === 'daily' ? 'default' : 'outline'}
            className="text-xs rounded-full h-8"
            onClick={() => setSearchParams({ cycle: 'daily' })}
          >
            Daily Cycle
          </Button>

          <Button
            size="sm"
            variant={activeCycleFilter === 'weekly' ? 'default' : 'outline'}
            className="text-xs rounded-full h-8"
            onClick={() => setSearchParams({ cycle: 'weekly' })}
          >
            Weekly Cycle
          </Button>

          <Button
            size="sm"
            variant={activeCycleFilter === 'monthly' ? 'default' : 'outline'}
            className="text-xs rounded-full h-8"
            onClick={() => setSearchParams({ cycle: 'monthly' })}
          >
            Monthly Cycle
          </Button>
        </div>
      </div>

      {/* ── Customer DataTable ── */}
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isPending}
        emptyTitle={search ? 'No matching customers' : 'No customers found'}
        onRowClick={(customer) => navigate(ADMIN_ROUTES.customerDetail(customer.id))}
      />

      {/* ── Place Order Modal ── */}
      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        preselectedCustomerId={orderCustomerId}
      />

      {/* ── Collect Payment Modal ── */}
      <CollectPaymentDialog
        open={collectDialogState.open}
        onOpenChange={(open) => setCollectDialogState((prev) => ({ ...prev, open }))}
        customerName={collectDialogState.customerName}
        customerPhone={collectDialogState.customerPhone}
        orders={collectDialogState.orders}
      />
    </div>
  )
}
