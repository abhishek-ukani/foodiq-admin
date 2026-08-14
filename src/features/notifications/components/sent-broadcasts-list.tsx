import dayjs from 'dayjs'
import { BellRing } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useSentBroadcasts } from '@/features/notifications/hooks/use-notifications'

const TYPE_TONE: Record<string, string> = {
  announcement: 'bg-primary/10 text-primary',
  offer: 'bg-success/15 text-success',
  maintenance: 'bg-amber-500/10 text-amber-600',
}

export function SentBroadcastsList() {
  const { broadcasts, isPending } = useSentBroadcasts()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sent history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
        ) : !broadcasts.length ? (
          <EmptyState icon={BellRing} title="Nothing sent yet" className="border-none py-10" />
        ) : (
          broadcasts.map((broadcast) => (
            <div key={`${broadcast.createdAt}-${broadcast.title}`} className="rounded-xl border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{broadcast.title}</p>
                  {broadcast.body ? (
                    <p className="text-muted-foreground text-sm">{broadcast.body}</p>
                  ) : null}
                </div>
                <Badge className={TYPE_TONE[broadcast.type] ?? 'bg-muted text-muted-foreground'}>
                  {broadcast.type}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {dayjs(broadcast.createdAt).format('D MMM YYYY, h:mm A')} · sent to{' '}
                {broadcast.recipientCount} recipient{broadcast.recipientCount === 1 ? '' : 's'}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
