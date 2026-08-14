import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  icon: Icon,
  isLoading,
  tone = 'default',
}: {
  label: string
  value: string
  icon: LucideIcon
  isLoading?: boolean
  tone?: 'default' | 'accent' | 'warning'
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-6">
        <div className="space-y-1.5">
          <p className="text-muted-foreground text-sm">{label}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <p className="text-2xl font-semibold">{value}</p>
          )}
        </div>
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            tone === 'accent' && 'bg-gold/15 text-gold',
            tone === 'warning' && 'bg-warning/15 text-warning',
            tone === 'default' && 'bg-primary/10 text-primary',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  )
}
