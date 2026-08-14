import { useState } from 'react'
import { useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { Mail, MapPin, PackageSearch, Phone, Plus, ShoppingBag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import {
  useCustomer,
  useCustomerAddresses,
  useCustomerOrders,
  useSetCustomerActive,
} from '@/features/customers/hooks/use-customers'
import { CreateOrderDialog } from '@/features/orders/components/create-order-dialog'
import { CURRENCY_SYMBOL } from '@/constants'

export function CustomerDetailPage() {
  const { id = '' } = useParams()
  const { data: customer, isPending } = useCustomer(id)
  const { data: orders, isPending: ordersPending } = useCustomerOrders(id)
  const { data: addresses } = useCustomerAddresses(id)
  const setActive = useSetCustomerActive()
  const [createOrderOpen, setCreateOrderOpen] = useState(false)

  if (isPending) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (!customer) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="text-lg">
                {(customer.full_name ?? customer.email ?? '?')[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-display text-xl font-semibold">{customer.full_name ?? 'Unnamed'}</h1>
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
          <div className="flex items-center gap-4">
            <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
              <ShoppingBag className="size-4" />
              Place Order
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm">{customer.is_active ? 'Active' : 'Deactivated'}</span>
              <Switch
                checked={customer.is_active}
                onCheckedChange={(checked) => setActive.mutate({ id: customer.id, is_active: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Total orders</p>
            <p className="text-2xl font-semibold">{customer.total_orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Total spent</p>
            <p className="text-2xl font-semibold">
              {CURRENCY_SYMBOL}
              {customer.total_spent}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Customer since</p>
            <p className="text-2xl font-semibold">{dayjs(customer.created_at).format('MMM YYYY')}</p>
          </CardContent>
        </Card>
      </div>

      {addresses?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved addresses</CardTitle>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Order history</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setCreateOrderOpen(true)} className="gap-1.5">
            <Plus className="size-3.5" />
            New Order
          </Button>
        </CardHeader>
        <CardContent>
          {ordersPending ? (
            <Skeleton className="h-32 w-full rounded-lg" />
          ) : !orders?.length ? (
            <EmptyState icon={PackageSearch} title="No orders yet" className="border-none py-8" />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-muted-foreground text-xs">
                      {dayjs(order.placed_at).format('D MMM YYYY, h:mm A')}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                  <p className="font-medium">
                    {CURRENCY_SYMBOL}
                    {order.total_amount}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
        preselectedCustomerId={id}
      />
    </div>
  )
}

