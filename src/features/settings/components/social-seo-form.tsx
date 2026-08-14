import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  seoSchema,
  socialLinksSchema,
  type SeoInput,
  type SocialLinksInput,
} from '@/features/settings/schemas/settings-schemas'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'

const SOCIAL_DEFAULTS: SocialLinksInput = { instagram: '', facebook: '', whatsapp: '', youtube: '' }
const SEO_DEFAULTS: SeoInput = { title: '', description: '', keywords: '', og_image: null }

function SocialLinksForm() {
  const value = useConfigValue<SocialLinksInput>('social_links')
  const update = useUpdateSystemConfig()
  const form = useForm<SocialLinksInput>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: SOCIAL_DEFAULTS,
  })

  useEffect(() => {
    if (value) form.reset(value)
  }, [value, form])

  const onSubmit = (values: SocialLinksInput) => update.mutate({ key: 'social_links', value: values })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'facebook', 'whatsapp', 'youtube'] as const).map((key) => (
            <FormField
              key={key}
              control={form.control}
              name={key}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{key}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  )
}

function SeoForm() {
  const value = useConfigValue<SeoInput>('seo')
  const update = useUpdateSystemConfig()
  const form = useForm<SeoInput>({
    resolver: zodResolver(seoSchema),
    defaultValues: SEO_DEFAULTS,
  })

  useEffect(() => {
    if (value) form.reset(value)
  }, [value, form])

  const onSubmit = (values: SeoInput) => update.mutate({ key: 'seo', value: values })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default page title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meta description</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="keywords"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Keywords (comma-separated)</FormLabel>
              <FormControl>
                <Input {...field} />
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
  )
}

export function SocialSeoForm() {
  const { isPending } = useSystemConfig()
  if (isPending) return <Skeleton className="h-96 w-full rounded-xl" />

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Shown in the site footer.</CardDescription>
        </CardHeader>
        <CardContent>
          <SocialLinksForm />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>SEO</CardTitle>
          <CardDescription>Default metadata for public pages.</CardDescription>
        </CardHeader>
        <CardContent>
          <SeoForm />
        </CardContent>
      </Card>
    </div>
  )
}
