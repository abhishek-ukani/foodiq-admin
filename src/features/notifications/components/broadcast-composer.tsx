import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { useAuthStore } from '@/features/auth/store/auth-store'
import { useSendBroadcast } from '@/features/notifications/hooks/use-notifications'
import { broadcastSchema, type BroadcastFormInput } from '@/features/notifications/schemas/broadcast-schema'

const AUDIENCE_LABEL: Record<BroadcastFormInput['audience'], string> = {
  all: 'Everyone (customers + staff)',
  customers: 'Customers only',
}

const TYPE_LABEL: Record<BroadcastFormInput['type'], string> = {
  announcement: 'Announcement',
  offer: 'Offer / promotion',
  maintenance: 'Maintenance notice',
}

const DEFAULTS: BroadcastFormInput = {
  audience: 'customers',
  type: 'announcement',
  title: '',
  body: '',
  actionUrl: '',
}

export function BroadcastComposer() {
  const user = useAuthStore((state) => state.user)
  const send = useSendBroadcast()
  const [pendingValues, setPendingValues] = useState<BroadcastFormInput | null>(null)

  const form = useForm<BroadcastFormInput>({
    resolver: zodResolver(broadcastSchema),
    defaultValues: DEFAULTS,
  })

  const confirmSend = () => {
    if (!pendingValues || !user) return
    send.mutate(
      {
        audience: pendingValues.audience,
        type: pendingValues.type,
        title: pendingValues.title,
        body: pendingValues.body,
        actionUrl: pendingValues.actionUrl,
        createdBy: user.id,
      },
      { onSuccess: () => form.reset(DEFAULTS) },
    )
    setPendingValues(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send a notification</CardTitle>
        <CardDescription>
          Delivered straight to the recipient's inbox and notification bell.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(setPendingValues)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(AUDIENCE_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TYPE_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Weekend Special!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Tell customers what's new…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actionUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="/menu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? 'Sending…' : 'Send notification'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <ConfirmDialog
        open={Boolean(pendingValues)}
        onOpenChange={(open) => !open && setPendingValues(null)}
        title="Send this notification?"
        description={`This will be delivered immediately to ${
          pendingValues ? AUDIENCE_LABEL[pendingValues.audience].toLowerCase() : ''
        }. This can't be recalled once sent.`}
        confirmLabel="Send now"
        destructive={false}
        isLoading={send.isPending}
        onConfirm={confirmSend}
      />
    </Card>
  )
}
