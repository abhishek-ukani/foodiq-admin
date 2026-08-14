import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
import dayjs from 'dayjs'
import { Download, MoreHorizontal, ShoppingBag, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTable } from '@/components/data-table/data-table'
import {
  useCustomers,
  useSetCustomerActive,
  useSetCustomerSubscriptionEligible,
} from '@/features/customers/hooks/use-customers'
import { CreateOrderDialog } from '@/features/orders/components/create-order-dialog'
import { downloadCsv } from '@/lib/csv-export'
import { ADMIN_ROUTES, CURRENCY_SYMBOL } from '@/constants'
import type { Tables } from '@/types/database.types'

type Customer = Tables<'profiles'>

function exportCustomersCsv(rows: Customer[]) {
  downloadCsv(
    `customers-${dayjs().format('YYYY-MM-DD')}.csv`,
    ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Joined', 'Status'],
    rows.map((c) => [
      c.full_name ?? '',
      c.email ?? '',
      c.phone ?? '',
      c.total_orders,
      c.total_spent,
      dayjs(c.created_at).format('YYYY-MM-DD'),
      c.is_active ? 'Active' : 'Inactive',
    ]),
  )
}

export function CustomersPage() {
  const navigate = useNavigate()
  const { data: customers, isPending } = useCustomers()
  const setActive = useSetCustomerActive()
  const setSubEligible = useSetCustomerSubscriptionEligible()
  const [search, setSearch] = useState('')

  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [orderCustomerId, setOrderCustomerId] = useState<string | undefined>()

  const filtered = useMemo(() => {
    if (!customers) return []
    const query = search.trim().toLowerCase()
    if (!query) return customers
    return customers.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query),
    )
  }, [customers, search])

  const columns = useMemo<ColumnDef<Customer>[]>(
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
              <p className="font-medium">{row.original.full_name ?? 'Unnamed'}</p>
              <p className="text-muted-foreground text-xs">{row.original.email}</p>
            </div>
          </div>
        ),
      },
      { accessorKey: 'phone', header: 'Phone' },
      { accessorKey: 'total_orders', header: 'Orders' },
      {
        accessorKey: 'total_spent',
        header: 'Total spent',
        cell: ({ row }) => `${CURRENCY_SYMBOL}${row.original.total_spent}`,
      },
      {
        accessorKey: 'is_subscription_eligible',
        header: 'Subscription Access',
        cell: ({ row }) => (
          <Badge variant={row.original.is_subscription_eligible ? 'default' : 'outline'}>
            {row.original.is_subscription_eligible ? 'Eligible' : 'Disabled'}
          </Badge>
        ),
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
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Actions" onClick={(e) => e.stopPropagation()}>
                <MoreHorizontal className="size-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setOrderCustomerId(row.original.id)
                  setCreateOrderOpen(true)
                }}
              >
                <ShoppingBag className="size-4 mr-2" />
                Place Order
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ADMIN_ROUTES.customerDetail(row.original.id))}>
                View details
              </DropdownMenuItem>
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
        ),
      },
    ],
    [navigate, setActive, setSubEligible],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground text-sm">{customers?.length ?? 0} registered customers.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => customers && exportCustomersCsv(customers)}
          disabled={!customers?.length}
        >
          <Download className="size-4" aria-hidden />
          Export CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isPending}
        emptyTitle={search ? 'No matching customers' : 'No customers yet'}
        onRowClick={(customer) => navigate(ADMIN_ROUTES.customerDetail(customer.id))}
      />

      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        preselectedCustomerId={orderCustomerId}
      />
    </div>
  )
}

