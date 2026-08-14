import dayjs from 'dayjs'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useSalesSeries } from '@/features/dashboard/hooks/use-dashboard-queries'
import { CURRENCY_SYMBOL } from '@/constants'
import { TrendingUp } from 'lucide-react'

function formatCompact(value: number) {
  if (value >= 100_000) return `${CURRENCY_SYMBOL}${(value / 100_000).toFixed(1)}L`
  if (value >= 1_000) return `${CURRENCY_SYMBOL}${(value / 1_000).toFixed(1)}K`
  return `${CURRENCY_SYMBOL}${value}`
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as { revenue: number; order_count: number }
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground text-xs">{dayjs(label).format('DD MMM YYYY')}</p>
      <p className="font-semibold">
        {CURRENCY_SYMBOL}
        {point.revenue.toLocaleString('en-IN')}
      </p>
      <p className="text-muted-foreground text-xs">{point.order_count} orders</p>
    </div>
  )
}

export function SalesChart() {
  const { data, isPending, isError } = useSalesSeries(30)
  const hasRevenue = data?.some((point) => point.revenue > 0)

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Revenue — last 30 days</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-72 w-full rounded-xl" />
        ) : isError || !hasRevenue ? (
          <EmptyState
            icon={TrendingUp}
            title="No revenue yet"
            description="Delivered orders will start filling in this chart."
            className="h-72 border-none py-0"
          />
        ) : (
          <ResponsiveContainer width="100%" height={288}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
              <XAxis
                dataKey="bucket"
                tickFormatter={(value) => dayjs(value).format('D MMM')}
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={24}
              />
              <YAxis
                tickFormatter={formatCompact}
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip content={ChartTooltip} cursor={{ stroke: 'var(--border)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="var(--primary)"
                fillOpacity={0.1}
                activeDot={{ r: 4, fill: 'var(--primary)', stroke: 'var(--card)', strokeWidth: 2 }}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
