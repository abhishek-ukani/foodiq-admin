import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUpload } from '@/components/common/image-upload'
import { categorySchema, slugify, type CategoryInput } from '@/features/menu/schemas/category-schema'
import { useCreateCategory, useUpdateCategory } from '@/features/menu/hooks/use-categories'
import type { Tables } from '@/types/database.types'

const DEFAULT_VALUES: CategoryInput = {
  name: '',
  name_gujarati: '',
  slug: '',
  description: '',
  image_url: null,
  display_order: 0,
  is_active: true,
  category_type: 'general',
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Tables<'categories'> | null
}) {
  const isEditing = Boolean(category)
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        category
          ? {
              name: category.name,
              name_gujarati: (category as any).name_gujarati ?? '',
              slug: category.slug,
              description: category.description ?? '',
              image_url: category.image_url,
              display_order: category.display_order,
              is_active: category.is_active,
              category_type: (category as any).category_type ?? 'general',
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, category, form])

  const onSubmit = (values: CategoryInput) => {
    const payload = { ...values, description: values.description || null }
    if (isEditing && category) {
      updateMutation.mutate(
        { id: category.id, input: payload },
        { onSuccess: () => onOpenChange(false) },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update how this category appears to customers.'
              : 'Categories group dishes on the menu, e.g. Gujarati or Punjabi.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value ?? null} onChange={field.onChange} bucket="food-images" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Sabji / Main Course"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          if (!isEditing) form.setValue('slug', slugify(e.target.value))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name_gujarati"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (Gujarati)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. શાક / મેઇન કોર્સ"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="gujarati" {...field} />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Traditional Gujarati home cooking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active</FormLabel>
                    <FormControl>
                      <div className="flex h-9 items-center">
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
