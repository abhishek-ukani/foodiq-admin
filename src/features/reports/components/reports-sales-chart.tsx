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
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useSalesReport } from '@/features/reports/hooks/use-reports'
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

export function ReportsSalesChart({
  from,
  to,
  granularity,
}: {
  from: string
  to: string
  granularity: 'day' | 'month' | 'year'
}) {
  const { data, isPending, isError } = useSalesReport(from, to, granularity)
  const hasRevenue = data?.some((point) => point.revenue > 0)
  const tickFormat = granularity === 'day' ? 'D MMM' : granularity === 'month' ? 'MMM YYYY' : 'YYYY'

  if (isPending) return <Skeleton className="h-80 w-full rounded-xl" />
  if (isError || !hasRevenue) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No revenue in this period"
        description="Try a wider date range."
        className="h-80 border-none py-0"
      />
    )
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
        <XAxis
          dataKey="bucket"
          tickFormatter={(value) => dayjs(value).format(tickFormat)}
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
  )
}
