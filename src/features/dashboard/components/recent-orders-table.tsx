import dayjs from 'dayjs'
import { Receipt } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useRecentOrders } from '@/features/dashboard/hooks/use-dashboard-queries'
import { CURRENCY_SYMBOL, DATE_TIME_FORMAT } from '@/constants'

export function RecentOrdersTable() {
  const { data: orders, isPending, isError } = useRecentOrders(8)

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base">Recent orders</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : isError || !orders?.length ? (
          <EmptyState
            icon={Receipt}
            title="No orders yet"
            description="Orders will appear here as soon as customers start placing them."
            className="border-none py-10"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.contact_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {dayjs(order.created_at).format(DATE_TIME_FORMAT)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {CURRENCY_SYMBOL}
                      {Number(order.total_amount).toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
