import { Link } from 'react-router-dom'
import { CompassIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ADMIN_ROUTES } from '@/constants'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
        <CompassIcon className="size-8" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground max-w-md text-sm">
          This section hasn&apos;t been built yet, or the link is out of date.
        </p>
      </div>
      <Button asChild>
        <Link to={ADMIN_ROUTES.dashboard}>Back to dashboard</Link>
      </Button>
    </div>
  )
}
