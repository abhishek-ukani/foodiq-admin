import { Flame } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useTopSellingItems } from '@/features/dashboard/hooks/use-dashboard-queries'
import { CURRENCY_SYMBOL } from '@/constants'

export function TopSellingItems() {
  const { data: items, isPending, isError } = useTopSellingItems(30, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top selling items</CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : isError || !items?.length ? (
          <EmptyState
            icon={Flame}
            title="No sales yet"
            description="Best sellers show up here once orders come in."
            className="border-none py-8"
          />
        ) : (
          <ul className="divide-border -mx-2 divide-y">
            {items.map((item, index) => (
              <li key={item.food_item_id} className="flex items-center gap-3 px-2 py-3">
                <span className="text-muted-foreground w-5 text-center font-mono text-sm">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.item_name}</p>
                  <p className="text-muted-foreground text-xs">{item.units_sold} sold</p>
                </div>
                <p className="text-sm font-semibold">
                  {CURRENCY_SYMBOL}
                  {Number(item.revenue).toLocaleString('en-IN')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
