import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { ItemCustomizationsManager } from '@/features/food-items/components/item-customizations-manager'
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
  item: FoodItemWithCategory | null
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Edit food item' : 'New food item'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Update this dish.' : 'Add a single dish to your catalog.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-4 pb-6" noValidate>
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

            <div className="grid grid-cols-2 gap-4">
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="What's in this dish?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Pricing — 3-column: price / compare_price (MRP) / cost_price (internal) */}
            <div className="rounded-lg border p-3 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing</p>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sell Price (₹)</FormLabel>
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
            <div className="rounded-lg border bg-amber-50/50 p-3 space-y-3">
              <p className="text-xs font-semibold text-amber-900 uppercase tracking-wider">Special Dietary Preparations</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-950">Swaminarayan Available</p>
                  <p className="text-muted-foreground text-xs">Prepared without onion, garlic, or root vegetables</p>
                </div>
                <FormField
                  control={form.control}
                  name="is_swaminarayan_available"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between border-t border-amber-200/60 pt-2">
                <div>
                  <p className="text-sm font-medium text-amber-950">Vaishnav Available</p>
                  <p className="text-muted-foreground text-xs">Sattvic preparation adhering to Vaishnav rules</p>
                </div>
                <FormField
                  control={form.control}
                  name="is_vaishnav_available"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>

              <div className="flex items-center justify-between border-t border-amber-200/60 pt-2">
                <div>
                  <p className="text-sm font-medium text-amber-950">Jain Available</p>
                  <p className="text-muted-foreground text-xs">Strict Jain preparation option available</p>
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

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Available</p>
                <p className="text-muted-foreground text-xs">Visible to customers when on a menu</p>
              </div>
              <FormField
                control={form.control}
                name="is_available"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Featured</p>
                <p className="text-muted-foreground text-xs">Highlight in popular/featured sections</p>
              </div>
              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Track stock</p>
                  <p className="text-muted-foreground text-xs">Limit how many can be ordered per day</p>
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
                      <FormLabel>Stock quantity</FormLabel>
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
              ) : null}
            </div>

            <SheetFooter className="px-0">
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create food item'}
              </Button>
            </SheetFooter>
          </form>
        </Form>

        {isEditing && item ? (
          <div className="px-4 pb-6">
            <ItemCustomizationsManager foodItemId={item.id} />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
