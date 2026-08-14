import { BroadcastComposer } from '@/features/notifications/components/broadcast-composer'
import { SentBroadcastsList } from '@/features/notifications/components/sent-broadcasts-list'

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Notifications</h1>
        <p className="text-muted-foreground text-sm">
          Send announcements, offers, and maintenance notices to your customers.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BroadcastComposer />
        <SentBroadcastsList />
      </div>
    </div>
  )
}
