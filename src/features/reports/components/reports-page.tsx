import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Download, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/common/empty-state'
import { Badge } from '@/components/ui/badge'
import { ReportsSalesChart } from '@/features/reports/components/reports-sales-chart'
import {
  useCustomerReport,
  usePopularItemsReport,
  useRetentionReport,
} from '@/features/reports/hooks/use-reports'
import { downloadCsv } from '@/lib/csv-export'
import { CURRENCY_SYMBOL } from '@/constants'

type PresetKey = 'today' | '7d' | '30d' | 'month' | 'year'

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]

function rangeFromPreset(preset: PresetKey): { from: string; to: string } {
  const today = dayjs()
  switch (preset) {
    case 'today':
      return { from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case '7d':
      return { from: today.subtract(6, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case '30d':
      return { from: today.subtract(29, 'day').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case 'month':
      return { from: today.startOf('month').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
    case 'year':
      return { from: today.startOf('year').format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }
  }
}

export function ReportsPage() {
  const [preset, setPreset] = useState<PresetKey>('30d')
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null)

  const { from, to } = customRange ?? rangeFromPreset(preset)
  const granularity = dayjs(to).diff(dayjs(from), 'day') > 120 ? 'month' : 'day'

  const { data: popularItems, isPending: popularPending } = usePopularItemsReport(from, to)
  const { data: customers, isPending: customersPending } = useCustomerReport(from, to)
  const { data: retention, isPending: retentionPending } = useRetentionReport(from, to)

  const totalRevenue = useMemo(
    () => customers?.reduce((sum, c) => sum + Number(c.total_spent), 0) ?? 0,
    [customers],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-muted-foreground text-sm">
          {dayjs(from).format('D MMM YYYY')} – {dayjs(to).format('D MMM YYYY')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <Badge
            key={p.key}
            variant={!customRange && preset === p.key ? 'default' : 'outline'}
            className="cursor-pointer px-3 py-1.5"
            onClick={() => {
              setPreset(p.key)
              setCustomRange(null)
            }}
          >
            {p.label}
          </Badge>
        ))}
        <div className="ml-2 flex items-center gap-2">
          <Input
            type="date"
            className="w-40"
            value={customRange?.from ?? from}
            onChange={(e) => setCustomRange({ from: e.target.value, to: customRange?.to ?? to })}
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            className="w-40"
            value={customRange?.to ?? to}
            onChange={(e) => setCustomRange({ from: customRange?.from ?? from, to: e.target.value })}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsSalesChart from={from} to={to} granularity={granularity} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Revenue (delivered orders)</p>
            <p className="text-2xl font-semibold">
              {CURRENCY_SYMBOL}
              {totalRevenue.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Repeat customer rate</p>
            <p className="text-2xl font-semibold">
              {retentionPending ? '—' : `${retention?.repeat_rate ?? 0}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">Avg orders / customer</p>
            <p className="text-2xl font-semibold">
              {retentionPending ? '—' : retention?.average_orders_per_customer ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Best-selling items</CardTitle>
          <Button
            variant="outline"
            size="sm"
            disabled={!popularItems?.length}
            onClick={() =>
              popularItems &&
              downloadCsv(
                `popular-items-${from}-to-${to}.csv`,
                ['Item', 'Kind', 'Units sold', 'Orders', 'Revenue'],
                popularItems.map((i) => [i.item_name, i.item_kind, i.units_sold, i.order_count, i.revenue]),
              )
            }
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {popularPending ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : !popularItems?.length ? (
            <EmptyState title="No sales in this period" className="border-none py-10" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Units sold</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularItems.map((item) => (
                  <TableRow key={item.food_item_id}>
                    <TableCell className="font-medium">{item.item_name}</TableCell>
                    <TableCell>{item.units_sold}</TableCell>
                    <TableCell>{item.order_count}</TableCell>
                    <TableCell className="text-right">
                      {CURRENCY_SYMBOL}
                      {item.revenue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Customers</CardTitle>
          <Button
            variant="outline"
            size="sm"
            disabled={!customers?.length}
            onClick={() =>
              customers &&
              downloadCsv(
                `customer-report-${from}-to-${to}.csv`,
                ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Avg Order Value', 'Repeat'],
                customers.map((c) => [
                  c.full_name ?? '',
                  c.email ?? '',
                  c.phone ?? '',
                  Number(c.order_count),
                  c.total_spent,
                  c.average_order_value,
                  c.is_repeat_customer ? 'Yes' : 'No',
                ]),
              )
            }
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {customersPending ? (
            <Skeleton className="h-48 w-full rounded-lg" />
          ) : !customers?.length ? (
            <EmptyState icon={Users} title="No customer activity in this period" className="border-none py-10" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total spent</TableHead>
                    <TableHead>Avg order value</TableHead>
                    <TableHead>Repeat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.user_id}>
                      <TableCell>
                        <p className="font-medium">{c.full_name ?? 'Unnamed'}</p>
                        <p className="text-muted-foreground text-xs">{c.email}</p>
                      </TableCell>
                      <TableCell>{Number(c.order_count)}</TableCell>
                      <TableCell>
                        {CURRENCY_SYMBOL}
                        {c.total_spent}
                      </TableCell>
                      <TableCell>
                        {CURRENCY_SYMBOL}
                        {c.average_order_value}
                      </TableCell>
                      <TableCell>
                        {c.is_repeat_customer ? (
                          <Badge variant="secondary">Repeat</Badge>
                        ) : (
                          <Badge variant="outline">First-time</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
