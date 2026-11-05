import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CategoryIcon } from './category-icon'
import type { CategoryBreakdown } from '../types'
import { CURRENCY_SYMBOL } from '@/constants'
import { PieChart as PieChartIcon } from 'lucide-react'

interface CategoryBreakdownChartProps {
  data: CategoryBreakdown[]
  totalAmount: number
  selectedCategory: string
  scope?: 'kitchen' | 'personal' | 'combined'
  onSelectCategory: (categoryId: string) => void
}

export function CategoryBreakdownChart({
  data,
  totalAmount,
  selectedCategory,
  scope = 'kitchen',
  onSelectCategory,
}: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      name: item.name,
      value: item.amount,
      color: item.color,
      percentage: item.percentage,
      categoryId: item.categoryId,
    }))
  }, [data])

  const subtitle =
    scope === 'personal'
      ? 'Visual breakdown of personal and family expenses by category. Click to filter.'
      : scope === 'combined'
        ? 'Combined distribution across both kitchen and personal categories. Click to filter.'
        : 'Interactive breakdown of kitchen overheads. Click a category to filter.'

  if (data.length === 0) {
    return (
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <PieChartIcon className="size-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Category-wise Distribution</CardTitle>
          </div>
          <CardDescription className="text-xs">
            {subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-44 flex-col items-center justify-center text-center text-muted-foreground text-sm">
            <p>No expenses found for this time period.</p>
            <p className="text-xs mt-1">Add an expense to view category distribution.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-xs overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <PieChartIcon className="size-4" />
            </div>
            <CardTitle className="text-base font-semibold">Category-wise Distribution</CardTitle>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {data.length} active {data.length === 1 ? 'category' : 'categories'}
          </span>
        </div>
        <CardDescription className="text-xs">
          {subtitle}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="h-56 w-full max-w-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0].payload as {
                        name: string
                        value: number
                        color: string
                        percentage: number
                      }
                      return (
                        <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold flex items-center gap-1.5">
                            <span
                              className="size-2.5 rounded-full inline-block"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                          </p>
                          <p className="mt-1 font-bold text-sm">
                            {CURRENCY_SYMBOL}
                            {item.value.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-muted-foreground ml-1.5">
                              ({item.percentage}%)
                            </span>
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={2}
                    stroke="var(--card)"
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.categoryId}
                        fill={entry.color}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onClick={() =>
                          onSelectCategory(
                            selectedCategory === entry.categoryId ? 'all' : entry.categoryId,
                          )
                        }
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Center Summary Label inside Donut */}
            <div className="pointer-events-none absolute flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Total
              </span>
              <span className="text-lg font-bold tracking-tight text-foreground">
                {CURRENCY_SYMBOL}
                {totalAmount >= 100000
                  ? `${(totalAmount / 100000).toFixed(1)}L`
                  : totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Ranked Category Progress Bars & Distribution List */}
          <div className="lg:col-span-7 space-y-2.5">
            {data.map((cat) => {
              const isSelected = selectedCategory === cat.categoryId
              return (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? 'all' : cat.categoryId)}
                  className={`group w-full text-left rounded-xl p-2.5 transition-all min-h-[44px] ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/30 shadow-xs'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-white text-[11px]"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CategoryIcon name={cat.iconName} className="size-3.5" />
                      </span>
                      <span className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground hidden sm:inline">
                        ({cat.count} {cat.count === 1 ? 'entry' : 'entries'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm text-foreground">
                        {CURRENCY_SYMBOL}
                        {cat.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-muted-foreground font-semibold min-w-[36px] text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(cat.percentage, 2)}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
