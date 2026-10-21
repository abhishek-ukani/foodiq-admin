import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  orderSettingsSchema,
  type OrderSettingsInput,
} from '@/features/settings/schemas/settings-schemas'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'

const DEFAULTS: OrderSettingsInput = {
  default_min_order_amount: 100,
  default_delivery_charge: 20,
  free_delivery_above: 500,
  max_advance_days: 7,
  allow_same_day: true,
  auto_accept_orders: false,
}

export function OrderSettingsForm() {
  const { isPending } = useSystemConfig()
  const value = useConfigValue<OrderSettingsInput>('order_settings')
  const update = useUpdateSystemConfig()

  const form = useForm<OrderSettingsInput>({
    resolver: zodResolver(orderSettingsSchema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    if (value) form.reset(value)
  }, [value, form])

  if (isPending) return <Skeleton className="h-96 w-full rounded-xl" />

  const onSubmit = (values: OrderSettingsInput) =>
    update.mutate({ key: 'order_settings', value: values })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Settings</CardTitle>
        <CardDescription>
          Defaults used when a delivery area doesn&apos;t override them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="default_min_order_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum order amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="default_delivery_charge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default delivery charge (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="free_delivery_above"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Free delivery above (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_advance_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max days customers can schedule ahead</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Allow same-day orders</p>
                <p className="text-muted-foreground text-xs">Subject to each delivery slot&apos;s cutoff time.</p>
              </div>
              <FormField
                control={form.control}
                name="allow_same_day"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Auto-accept new orders</p>
                <p className="text-muted-foreground text-xs">
                  Skip the manual accept step — orders go straight to accepted.
                </p>
              </div>
              <FormField
                control={form.control}
                name="auto_accept_orders"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
