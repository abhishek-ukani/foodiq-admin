import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ImageUpload } from '@/components/common/image-upload'
import { FormField } from '@/components/ui/form'
import { type BrandingInput } from '@/features/settings/schemas/settings-schemas'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'

const DEFAULTS: BrandingInput = { logo_url: null, favicon_url: null, hero_image_url: null }

export function BrandingForm() {
  const { isPending } = useSystemConfig()
  const value = useConfigValue<BrandingInput>('branding')
  const update = useUpdateSystemConfig()

  const form = useForm<BrandingInput>({ defaultValues: DEFAULTS })

  useEffect(() => {
    if (value) form.reset(value)
  }, [value, form])

  if (isPending) return <Skeleton className="h-64 w-full rounded-xl" />

  const onSubmit = (values: BrandingInput) => update.mutate({ key: 'branding', value: values })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Logo, favicon, and hero image used across the site.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-medium">Logo</p>
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <ImageUpload value={field.value ?? null} onChange={field.onChange} bucket="branding" />
                )}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Favicon</p>
              <FormField
                control={form.control}
                name="favicon_url"
                render={({ field }) => (
                  <ImageUpload value={field.value ?? null} onChange={field.onChange} bucket="branding" />
                )}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Hero image</p>
              <FormField
                control={form.control}
                name="hero_image_url"
                render={({ field }) => (
                  <ImageUpload value={field.value ?? null} onChange={field.onChange} bucket="branding" />
                )}
              />
            </div>
          </div>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
