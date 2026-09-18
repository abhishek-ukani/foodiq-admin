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
import { ItemVariantsManager } from '@/features/food-items/components/item-variants-manager'
import { foodItemSchema, slugify, type FoodItemInput } from '@/features/food-items/schemas/food-item-schema'
import { useCreateFoodItem, useUpdateFoodItem } from '@/features/food-items/hooks/use-food-items'
import { useCategories } from '@/features/menu/hooks/use-categories'
import type { FoodItemWithCategory } from '@/features/food-items/services/food-items-service'

const DEFAULT_VALUES: FoodItemInput = {
  category_id: null,
  name: '',
  name_gujarati: '',
  slug: '',
  description: '',
  food_type: 'veg',
  price: 0,
  compare_price: null,
  cost_price: null,
  image_url: null,
  is_available: true,
  is_featured: false,
  is_swaminarayan_available: false,
  is_vaishnav_available: false,
  is_jain_available: false,
  track_stock: false,
  stock_quantity: 0,
}

export function FoodItemFormSheet({
  open,
  onOpenChange,
  item,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: FoodItemWithCategory | null
}) {
  const isEditing = Boolean(item)
  const { data: categories } = useCategories()
  const createMutation = useCreateFoodItem()
  const updateMutation = useUpdateFoodItem()
  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const form = useForm<FoodItemInput>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        item
          ? {
              category_id: item.category_id,
              name: item.name,
              name_gujarati: (item as any).name_gujarati ?? '',
              slug: item.slug,
              description: item.description ?? '',
              food_type: item.food_type,
              price: item.price,
              compare_price: item.compare_price,
              cost_price: (item as any).cost_price ?? null,
              image_url: item.image_url,
              is_available: item.is_available,
              is_featured: item.is_featured,
              is_swaminarayan_available: (item as any).is_swaminarayan_available ?? false,
              is_vaishnav_available: (item as any).is_vaishnav_available ?? false,
              is_jain_available: (item as any).is_jain_available ?? false,
              track_stock: item.track_stock,
              stock_quantity: item.stock_quantity,
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, item, form])

  const trackStock = form.watch('track_stock')

  const onSubmit = (values: FoodItemInput) => {
    const payload = {
      ...values,
      description: values.description || null,
      kind: item?.kind ?? ('single' as const),
      display_order: item?.display_order ?? 0,
    }
    if (isEditing && item) {
      updateMutation.mutate({ id: item.id, input: payload }, { onSuccess: () => onOpenChange(false) })
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">{isEditing ? 'Edit Food Item' : 'New Food Item'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {isEditing ? 'Update this dish, pricing, and packaging variants.' : 'Add a single dish to your catalog.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2" noValidate>
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <ImageUpload value={field.value} onChange={field.onChange} bucket="food-images" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name (English)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Gujarati Thali"
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
                        placeholder="e.g. ગુજરાતી થાળી"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="gujarati-thali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value ?? 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Uncategorized</SelectItem>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="What's in this dish?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing — 3-column: price / compare_price (MRP) / cost_price (internal) */}
            <div className="rounded-xl border p-3.5 space-y-3 bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalog Pricing</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sell Price (₹) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
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
                  name="compare_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>MRP / Was (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="optional"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Price (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="internal"
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Cost price is internal only — never shown to customers.</p>
            </div>

            {/* Preparation Special Options (Swaminarayan, Vaishnav & Jain) */}
            <div className="rounded-xl border bg-amber-50/40 border-amber-200/80 p-3.5 space-y-3">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Special Dietary Preparations</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-white/60">
                  <div>
                    <p className="text-xs font-semibold text-amber-950">Swaminarayan</p>
                    <p className="text-[10px] text-muted-foreground">No onion, garlic, roots</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_swaminarayan_available"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-white/60">
                  <div>
                    <p className="text-xs font-semibold text-amber-950">Vaishnav</p>
                    <p className="text-[10px] text-muted-foreground">Sattvic preparation</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_vaishnav_available"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg border bg-white/60">
                  <div>
                    <p className="text-xs font-semibold text-amber-950">Jain</p>
                    <p className="text-[10px] text-muted-foreground">Strict Jain diet</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_jain_available"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/10">
                <div>
                  <p className="text-xs sm:text-sm font-medium">Available</p>
                  <p className="text-muted-foreground text-[11px]">Visible to customers when on menu</p>
                </div>
                <FormField
                  control={form.control}
                  name="is_available"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border p-3 bg-muted/10">
                <div>
                  <p className="text-xs sm:text-sm font-medium">Featured</p>
                  <p className="text-muted-foreground text-[11px]">Highlight in popular sections</p>
                </div>
                <FormField
                  control={form.control}
                  name="is_featured"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border p-3.5 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium">Track stock</p>
                  <p className="text-muted-foreground text-[11px]">Limit how many can be ordered per day</p>
                </div>
                <FormField
                  control={form.control}
                  name="track_stock"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
              {trackStock ? (
                <FormField
                  control={form.control}
                  name="stock_quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Stock quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                          className="w-36 h-10 text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            {/* Packaging & Weight Variants (when editing an existing item) */}
            {isEditing && item ? (
              <div className="pt-2">
                <ItemVariantsManager foodItemId={item.id} defaultPrice={item.price} />
              </div>
            ) : null}

            {/* Dialog Footer with Cancel and Save buttons at bottom */}
            <DialogFooter className="pt-4 gap-2 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 min-w-[90px]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 min-w-[130px]">
                {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create food item'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
