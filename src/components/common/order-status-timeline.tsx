import { Check, X } from 'lucide-react'
import { ORDER_STATUS_META, ORDER_TIMELINE } from '@/constants'
import type { OrderStatus } from '@/types/database.types'
import { cn } from '@/lib/utils'

/** Forward-progress timeline. Terminal non-happy-path statuses (cancelled/rejected) render as a single stop. */
export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'cancelled' || status === 'rejected') {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-dashed p-4">
        <span className="bg-destructive/10 text-destructive flex size-8 shrink-0 items-center justify-center rounded-full">
          <X className="size-4" aria-hidden />
        </span>
        <div>
          <p className="font-medium">{ORDER_STATUS_META[status].label}</p>
          <p className="text-muted-foreground text-sm">{ORDER_STATUS_META[status].description}</p>
        </div>
      </div>
    )
  }

  const currentIndex = ORDER_TIMELINE.indexOf(status)

  return (
    <ol className="space-y-0">
      {ORDER_TIMELINE.map((step, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === ORDER_TIMELINE.length - 1
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-medium',
                  isDone || isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              {!isLast ? (
                <span className={cn('my-1 w-0.5 flex-1', isDone ? 'bg-primary' : 'bg-border')} />
              ) : null}
            </div>
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p className={cn('font-medium', !isDone && !isCurrent && 'text-muted-foreground')}>
                {ORDER_STATUS_META[step].label}
              </p>
              <p className="text-muted-foreground text-sm">{ORDER_STATUS_META[step].description}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
