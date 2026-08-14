import { Badge } from '@/components/ui/badge'
import { ORDER_STATUS_META } from '@/constants'
import type { OrderStatus } from '@/types/database.types'
import { cn } from '@/lib/utils'

const TONE_CLASSES: Record<string, string> = {
  neutral: 'bg-muted text-muted-foreground',
  info: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  danger: 'bg-destructive/10 text-destructive',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status]
  return (
    <Badge variant="outline" className={cn('border-transparent', TONE_CLASSES[meta.tone])}>
      {meta.label}
    </Badge>
  )
}
