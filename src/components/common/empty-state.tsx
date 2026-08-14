import type { LucideIcon } from 'lucide-react'
import { PackageOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-16 text-center',
        className,
      )}
    >
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-full">
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}
