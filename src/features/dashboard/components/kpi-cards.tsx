import { CalendarClock, IndianRupee, ShoppingBag, Users } from 'lucide-react'
import { StatCard } from '@/components/common/stat-card'
import { useDashboardSummary } from '@/features/dashboard/hooks/use-dashboard-queries'
import { CURRENCY_SYMBOL } from '@/constants'

function formatCurrency(value: number) {
  return `${CURRENCY_SYMBOL}${value.toLocaleString('en-IN')}`
}

export function KpiCards() {
  const { data, isPending } = useDashboardSummary()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Today's orders"
        value={String(data?.todays_orders ?? 0)}
        icon={ShoppingBag}
        isLoading={isPending}
      />
      <StatCard
        label="Today's revenue"
        value={formatCurrency(data?.todays_revenue ?? 0)}
        icon={IndianRupee}
        isLoading={isPending}
        tone="accent"
      />
      <StatCard
        label="Pending orders"
        value={String(data?.pending_orders ?? 0)}
        icon={CalendarClock}
        isLoading={isPending}
        tone="warning"
      />
      <StatCard
        label="Total customers"
        value={String(data?.total_customers ?? 0)}
        icon={Users}
        isLoading={isPending}
      />
    </div>
  )
}
