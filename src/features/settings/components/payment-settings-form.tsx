import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormField } from '@/components/ui/form'
import {
  paymentSettingsSchema,
  type PaymentSettingsInput,
} from '@/features/settings/schemas/settings-schemas'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'

const DEFAULTS: PaymentSettingsInput = {
  cash_enabled: true,
  upi_enabled: true,
  require_upi_reference: true,
}

function PaymentMethodsForm() {
  const { isPending } = useSystemConfig()
  const value = useConfigValue<PaymentSettingsInput>('payment_settings')
  const update = useUpdateSystemConfig()

  const form = useForm<PaymentSettingsInput>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: DEFAULTS,
  })

  useEffect(() => {
    if (value) form.reset(value)
  }, [value, form])

  if (isPending) return <Skeleton className="h-48 w-full rounded-xl" />

  const onSubmit = (values: PaymentSettingsInput) =>
    update.mutate({ key: 'payment_settings', value: values })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <p className="text-sm font-medium">Cash on delivery</p>
          <FormField
            control={form.control}
            name="cash_enabled"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <p className="text-sm font-medium">UPI</p>
          <FormField
            control={form.control}
            name="upi_enabled"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Require UPI reference</p>
            <p className="text-muted-foreground text-xs">Ask customers to enter their transaction ID.</p>
          </div>
          <FormField
            control={form.control}
            name="require_upi_reference"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}

export function PaymentSettingsForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Configure payment methods available for orders.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodsForm />
        </CardContent>
      </Card>
    </div>
  )
}
