import dayjs from 'dayjs'
import { Mail } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useContactMessages, useUpdateContactMessageStatus } from '@/features/content/hooks/use-content'
import type { ContactStatus } from '@/types/database.types'

const STATUS_OPTIONS: ContactStatus[] = ['new', 'in_progress', 'resolved', 'archived']

export function ContactMessagesTab() {
  const { data: messages, isPending } = useContactMessages()
  const updateStatus = useUpdateContactMessageStatus()

  if (isPending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!messages?.length) {
    return <EmptyState icon={Mail} title="No messages yet" className="border-none py-10" />
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card key={message.id}>
          <CardContent className="space-y-2 pt-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium">
                  {message.name} <span className="text-muted-foreground text-xs">({message.email})</span>
                </p>
                {message.subject ? <p className="text-sm font-medium">{message.subject}</p> : null}
              </div>
              <Select
                value={message.status}
                onValueChange={(v) =>
                  updateStatus.mutate({ id: message.id, status: v as ContactStatus })
                }
              >
                <SelectTrigger className="w-36 capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status} className="capitalize">
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground text-sm">{message.message}</p>
            <p className="text-muted-foreground text-xs">
              {dayjs(message.created_at).format('D MMM YYYY, h:mm A')}
              {message.phone ? ` · ${message.phone}` : ''}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
