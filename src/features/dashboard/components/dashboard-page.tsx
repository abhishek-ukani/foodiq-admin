import { KpiCards } from '@/features/dashboard/components/kpi-cards'
import { SalesChart } from '@/features/dashboard/components/sales-chart'
import { TopSellingItems } from '@/features/dashboard/components/top-selling-items'
import { RecentOrdersTable } from '@/features/dashboard/components/recent-orders-table'

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          A live snapshot of today&apos;s orders, revenue, and top sellers.
        </p>
      </div>

      <KpiCards />

      <div className="grid gap-4 lg:grid-cols-3">
        <SalesChart />
        <TopSellingItems />
      </div>

      <RecentOrdersTable />
    </div>
  )
}
