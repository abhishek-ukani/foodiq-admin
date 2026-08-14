import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Plus, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table/data-table'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import { OrderDetailDialog } from '@/features/orders/components/order-detail-dialog'
import { CreateOrderDialog } from '@/features/orders/components/create-order-dialog'
import { useOrders } from '@/features/orders/hooks/use-orders'
import type { AdminOrder } from '@/features/orders/services/orders-service'
import { CURRENCY_SYMBOL, ORDER_STATUS_META } from '@/constants'
import type { OrderStatus } from '@/types/database.types'

const STATUS_TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: ORDER_STATUS_META.pending.label },
  { value: 'accepted', label: ORDER_STATUS_META.accepted.label },
  { value: 'preparing', label: ORDER_STATUS_META.preparing.label },
  { value: 'ready', label: ORDER_STATUS_META.ready.label },
  { value: 'out_for_delivery', label: ORDER_STATUS_META.out_for_delivery.label },
  { value: 'delivered', label: ORDER_STATUS_META.delivered.label },
]

export function OrdersPage() {
  const { data: orders, isPending } = useOrders()
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [createOrderOpen, setCreateOrderOpen] = useState(false)

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) ?? null

  const filtered = useMemo(() => {
    if (!orders) return []
    let result = orders
    if (statusFilter !== 'all') result = result.filter((o) => o.status === statusFilter)
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(query) ||
          o.contact_name.toLowerCase().includes(query) ||
          o.contact_phone.includes(query),
      )
    }
    return result
  }, [orders, statusFilter, search])

  const columns = useMemo<ColumnDef<AdminOrder>[]>(
    () => [
      { accessorKey: 'order_number', header: 'Order' },
      {
        accessorKey: 'contact_name',
        header: 'Customer',
        cell: ({ row }) => (
          <div>
            <p>{row.original.contact_name}</p>
            <p className="text-muted-foreground text-xs">{row.original.contact_phone}</p>
          </div>
        ),
      },
      {
        accessorKey: 'placed_at',
        header: 'Placed',
        cell: ({ row }) => dayjs(row.original.placed_at).format('D MMM, h:mm A'),
      },
      {
        accessorKey: 'delivery_date',
        header: 'Delivery',
        cell: ({ row }) => `${dayjs(row.original.delivery_date).format('D MMM')} · ${row.original.delivery_slot_label ?? ''}`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-medium">
            {CURRENCY_SYMBOL}
            {row.original.total_amount}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Orders</h1>
          <p className="text-muted-foreground text-sm">Accept, prepare, and track every order.</p>
        </div>
        <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
          <Plus className="size-4" />
          Create Order for Customer
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'all')}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order #, name, or phone…"
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isPending}
        emptyTitle="No orders found"
        emptyDescription="Orders will appear here as customers place them."
        onRowClick={(order) => setSelectedOrderId(order.id)}
      />

      <OrderDetailDialog
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />

      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
      />
    </div>
  )
}

