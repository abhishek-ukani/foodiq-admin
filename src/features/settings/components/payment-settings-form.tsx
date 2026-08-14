import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, QrCode, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { ImageUpload } from '@/components/common/image-upload'
import { Form, FormField } from '@/components/ui/form'
import {
  paymentSettingsSchema,
  type PaymentSettingsInput,
} from '@/features/settings/schemas/settings-schemas'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'
import { getDefaultBranchId } from '@/lib/default-branch'
import { supabase } from '@/lib/supabase'
import { ADMIN_QUERY_KEYS } from '@/constants'
import type { Tables } from '@/types/database.types'

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

function useUpiQrCodes() {
  return useQuery({
    queryKey: ADMIN_QUERY_KEYS.upiQr,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upi_qr_codes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

function UpiQrManager() {
  const { data: codes, isPending } = useUpiQrCodes()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [upiId, setUpiId] = useState('')
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.upiQr })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!qrUrl) throw new Error('Upload a QR code image first.')
      const branch_id = await getDefaultBranchId()
      const { error } = await supabase.from('upi_qr_codes').insert({
        branch_id,
        label,
        upi_id: upiId || null,
        qr_image_url: qrUrl,
        is_active: true,
      })
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      toast.success('UPI QR code added')
      setShowForm(false)
      setLabel('')
      setUpiId('')
      setQrUrl(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('upi_qr_codes').update({ is_active }).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  })

  const deleteCode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('upi_qr_codes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      invalidate()
      toast.success('QR code removed')
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="space-y-4">
      {isPending ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : !codes?.length && !showForm ? (
        <EmptyState
          icon={QrCode}
          title="No UPI QR code yet"
          description="Upload one so customers can pay by scanning it at checkout."
          className="border-none py-10"
          action={
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" aria-hidden />
              Add QR code
            </Button>
          }
        />
      ) : (
        <>
          {codes?.map((code: Tables<'upi_qr_codes'>) => (
            <div key={code.id} className="flex items-center gap-4 rounded-lg border p-3">
              <img src={code.qr_image_url} alt={code.label} className="size-16 rounded-md object-cover" />
              <div className="flex-1">
                <p className="text-sm font-medium">{code.label}</p>
                {code.upi_id ? <p className="text-muted-foreground text-xs">{code.upi_id}</p> : null}
              </div>
              <Badge variant={code.is_active ? 'secondary' : 'outline'}>
                {code.is_active ? 'Active' : 'Inactive'}
              </Badge>
              <Switch
                checked={code.is_active}
                onCheckedChange={(checked) => toggleActive.mutate({ id: code.id, is_active: checked })}
              />
              <Button variant="ghost" size="icon" onClick={() => deleteCode.mutate(code.id)}>
                <Trash2 className="text-destructive size-4" aria-hidden />
              </Button>
            </div>
          ))}

          {showForm ? (
            <div className="space-y-3 rounded-lg border p-4">
              <ImageUpload value={qrUrl} onChange={setQrUrl} bucket="upi-qr" className="max-w-xs" />
              <Input placeholder="Label (e.g. Main UPI)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <Input placeholder="UPI ID (optional)" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !label || !qrUrl}
                >
                  {createMutation.isPending ? 'Saving…' : 'Save QR code'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowForm(true)}>
              <Plus className="size-4" aria-hidden />
              Add another QR code
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export function PaymentSettingsForm() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Choose which ways customers can pay.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentMethodsForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>UPI QR Codes</CardTitle>
          <CardDescription>Shown to customers at checkout when they choose UPI.</CardDescription>
        </CardHeader>
        <CardContent>
          <UpiQrManager />
        </CardContent>
      </Card>
    </div>
  )
}
