import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  maintenanceSchema,
  type MaintenanceInput,
} from '@/features/settings/schemas/settings-schemas'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'

const DEFAULTS: MaintenanceInput = { enabled: false, message: '' }

export function MaintenanceForm() {
  const { isPending } = useSystemConfig()
  const value = useConfigValue<MaintenanceInput>('maintenance')
  const update = useUpdateSystemConfig()

  const form = useForm<MaintenanceInput>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    if (value) form.reset(value)
  }, [value, form])

  if (isPending) return <Skeleton className="h-48 w-full rounded-xl" />

  const onSubmit = (values: MaintenanceInput) => update.mutate({ key: 'maintenance', value: values })
  const enabled = form.watch('enabled')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
        <CardDescription>Temporarily show a notice instead of the ordering flow.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {enabled ? (
              <div className="bg-warning/10 text-warning-foreground flex items-start gap-2 rounded-lg p-3 text-sm">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                Maintenance mode is on — customers will see this message instead of the site.
              </div>
            ) : null}

            <div className="flex items-center justify-between rounded-lg border p-3">
              <p className="text-sm font-medium">Enable maintenance mode</p>
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message shown to customers</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="We'll be back online shortly…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
