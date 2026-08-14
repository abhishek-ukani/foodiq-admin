import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  X,
} from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageUpload } from '@/components/common/image-upload'
import { foodItemSchema, slugify, type FoodItemInput } from '@/features/food-items/schemas/food-item-schema'
import { useCreateFoodItem, useUpdateFoodItem, useFoodItems } from '@/features/food-items/hooks/use-food-items'
import { useCategories } from '@/features/menu/hooks/use-categories'
import {
  useThaliOptionGroups,
  useCreateThaliOptionGroup,
  useUpdateThaliOptionGroup,
  useDeleteThaliOptionGroup,
  useCreateThaliOptionItem,
  useUpdateThaliOptionItem,
  useDeleteThaliOptionItem,
  type ThaliOptionGroupWithItems,
} from '../services/thali-admin-service'
import { CURRENCY_SYMBOL } from '@/constants'
import type { FoodItemWithCategory } from '@/features/food-items/services/food-items-service'
import type { TablesInsert } from '@/types/database.types'

const DEFAULT_VALUES: FoodItemInput = {
  category_id: null,
  name: '',
  slug: '',
  description: '',
  food_type: 'veg',
  price: 0,
  offer_price: null,
  image_url: null,
  is_available: true,
  is_featured: false,
  track_stock: false,
  stock_quantity: 0,
}

export function ThaliEditorSheet({
  open,
  onOpenChange,
  thaliItem,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  thaliItem: FoodItemWithCategory | null
}) {
  const isEditing = Boolean(thaliItem)
  const { data: categories } = useCategories()
  const createThaliMutation = useCreateFoodItem()
  const updateThaliMutation = useUpdateFoodItem()
  const isSubmitting = createThaliMutation.isPending || updateThaliMutation.isPending

  const [activeTab, setActiveTab] = useState<'basic' | 'customizations'>('basic')

  // Option group dialog state inside the sheet
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ThaliOptionGroupWithItems | null>(null)
  const [groupName, setGroupName] = useState('')
  const [groupDescription, setGroupDescription] = useState('')
  const [groupType, setGroupType] = useState<'static_choice' | 'daily_menu_choice' | 'optional_addon'>('daily_menu_choice')
  const [targetCategoryType, setTargetCategoryType] = useState<string>('sabji')
  const [targetCategoryId, setTargetCategoryId] = useState<string>('')
  const [minSelect, setMinSelect] = useState(1)
  const [maxSelect, setMaxSelect] = useState(1)
  const [isRequired, setIsRequired] = useState(true)

  // Item dialog state inside group
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string>('')
  const [itemLabel, setItemLabel] = useState('')
  const [itemPriceDelta, setItemPriceDelta] = useState(0)
  const [itemIsDefault, setItemIsDefault] = useState(false)

  const { data: optionGroups } = useThaliOptionGroups(thaliItem?.id)
  const { data: foodItemsCatalog } = useFoodItems()
  const createGroup = useCreateThaliOptionGroup()
  const updateGroup = useUpdateThaliOptionGroup()
  const deleteGroup = useDeleteThaliOptionGroup()
  const createItem = useCreateThaliOptionItem()
  const updateItem = useUpdateThaliOptionItem()
  const deleteItem = useDeleteThaliOptionItem()

  const form = useForm<FoodItemInput>({
    resolver: zodResolver(foodItemSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      const thaliCat = categories?.find((c) => c.name.toLowerCase().includes('thali'))
      form.reset(
        thaliItem
          ? {
              category_id: thaliItem.category_id,
              name: thaliItem.name,
              slug: thaliItem.slug,
              description: thaliItem.description ?? '',
              food_type: thaliItem.food_type,
              price: thaliItem.price,
              offer_price: thaliItem.offer_price,
              image_url: thaliItem.image_url,
              is_available: thaliItem.is_available,
              is_featured: thaliItem.is_featured,
              track_stock: thaliItem.track_stock,
              stock_quantity: thaliItem.stock_quantity,
            }
          : {
              ...DEFAULT_VALUES,
              category_id: thaliCat?.id || null,
            },
      )
      setActiveTab('basic')
    }
  }, [open, thaliItem, categories, form])

  const onSubmitBasic = (values: FoodItemInput) => {
    const payload = {
      ...values,
      description: values.description || null,
      kind: 'single' as const,
      display_order: thaliItem?.display_order ?? 0,
    }

    if (isEditing && thaliItem) {
      updateThaliMutation.mutate(
        { id: thaliItem.id, input: payload },
        {
          onSuccess: () => {
            setActiveTab('customizations')
          },
        },
      )
    } else {
      createThaliMutation.mutate(payload, {
        onSuccess: (created) => {
          createGroup.mutate({
            food_item_id: created.id,
            name: 'Select Sabji',
            group_type: 'daily_menu_choice',
            min_select: 1,
            max_select: 1,
            is_required: true,
            display_order: 1,
          })
          setActiveTab('customizations')
        },
      })
    }
  }

  const handleOpenGroupDialog = (grp?: ThaliOptionGroupWithItems) => {
    if (grp) {
      setEditingGroup(grp)
      setGroupName(grp.name)
      setGroupDescription(grp.description || '')
      setGroupType(grp.group_type as any)
      setTargetCategoryType((grp as any).target_category_type ?? 'sabji')
      setTargetCategoryId((grp as any).target_category_id ?? '')
      setMinSelect(grp.min_select)
      setMaxSelect(grp.max_select)
      setIsRequired(grp.is_required)
    } else {
      setEditingGroup(null)
      setGroupName('')
      setGroupDescription('')
      setGroupType('daily_menu_choice')
      setTargetCategoryType('sabji')
      setTargetCategoryId('')
      setMinSelect(1)
      setMaxSelect(1)
      setIsRequired(true)
    }
    setGroupDialogOpen(true)
  }

  const handleSaveGroup = () => {
    if (!thaliItem?.id || !groupName.trim()) return

    const targetCat = targetCategoryType || 'sabji'
    const targetCatId = targetCategoryId || null

    if (editingGroup) {
      updateGroup.mutate(
        {
          id: editingGroup.id,
          input: {
            name: groupName.trim(),
            description: groupDescription.trim() || null,
            group_type: groupType,
            target_category_type: targetCat,
            target_category_id: targetCatId,
            min_select: minSelect,
            max_select: maxSelect,
            is_required: isRequired,
          } as any,
        },
        { onSuccess: () => setGroupDialogOpen(false) },
      )
    } else {
      const payload: TablesInsert<'thali_option_groups'> = {
        food_item_id: thaliItem.id,
        name: groupName.trim(),
        description: groupDescription.trim() || null,
        group_type: groupType,
        target_category_type: targetCat,
        target_category_id: targetCatId,
        min_select: minSelect,
        max_select: maxSelect,
        is_required: isRequired,
      } as any
      createGroup.mutate(payload, { onSuccess: () => setGroupDialogOpen(false) })
    }
  }

  const handleOpenItemDialog = (groupId: string) => {
    setActiveGroupId(groupId)
    setSelectedFoodItemId('')
    setItemLabel('')
    setItemPriceDelta(0)
    setItemIsDefault(false)
    setItemDialogOpen(true)
  }

  const handleSaveItem = () => {
    if (!activeGroupId || !itemLabel.trim()) return

    createItem.mutate(
      {
        group_id: activeGroupId,
        linked_food_item_id: selectedFoodItemId || null,
        label: itemLabel.trim(),
        price_delta: itemPriceDelta,
        is_default: itemIsDefault,
        is_active: true,
      },
      { onSuccess: () => setItemDialogOpen(false) },
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg font-semibold">{isEditing ? `Edit ${thaliItem?.name}` : 'New Thali'}</SheetTitle>
          <SheetDescription className="text-xs">
            {isEditing ? 'Update pricing, details, and customization options.' : 'Add a new Thali to your catalog.'}
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="px-4 pb-6 space-y-5">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">1. Basic Details</TabsTrigger>
            <TabsTrigger value="customizations" disabled={!isEditing && !thaliItem}>
              2. Customizations ({optionGroups?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BASIC THALI INFO */}
          <TabsContent value="basic" className="space-y-4 pt-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitBasic)} className="space-y-4" noValidate>
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Photo</FormLabel>
                      <FormControl>
                        <ImageUpload value={field.value} onChange={field.onChange} bucket="food-images" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Regular Thali"
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ({CURRENCY_SYMBOL})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="1"
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
                    name="offer_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Price (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step="1"
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={2}
                          placeholder="e.g. Includes 5 Roti / 2 Bhakhri, 1 Sabji, Salad/Gud/Achar"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Available</p>
                    <p className="text-muted-foreground text-xs">Visible to customers when ordering</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_available"
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>

                <SheetFooter className="px-0 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting
                      ? 'Saving…'
                      : isEditing
                        ? 'Save & Continue to Options →'
                        : 'Create Thali & Setup Options →'}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </TabsContent>

          {/* TAB 2: CUSTOMIZATION OPTIONS */}
          <TabsContent value="customizations" className="space-y-4 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold">Customization Groups</h3>
                <p className="text-xs text-muted-foreground">
                  Manage sub-category options for this Thali.
                </p>
              </div>
              <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => handleOpenGroupDialog()}>
                <Plus className="size-3.5" /> Add Group
              </Button>
            </div>

            {!optionGroups?.length ? (
              <div className="rounded-lg border border-dashed p-6 text-center space-y-2">
                <p className="text-sm font-medium">No option groups</p>
                <p className="text-xs text-muted-foreground">
                  Click 'Add Group' above to set up Sabji or Bread choices.
                </p>
                <Button size="sm" variant="outline" onClick={() => handleOpenGroupDialog()}>
                  <Plus className="size-3.5 mr-1" /> Add First Group
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {optionGroups.map((grp) => (
                  <div key={grp.id} className="rounded-xl border bg-card p-4 space-y-3 shadow-xs">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{grp.name}</span>
                        <Badge
                          variant="secondary"
                          className={
                            grp.group_type === 'daily_menu_choice'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-medium'
                              : 'bg-primary/10 text-primary text-[11px] font-medium'
                          }
                        >
                          {grp.group_type === 'daily_menu_choice' ? 'Daily Sabji' : 'Static Choice'}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                          Select {grp.max_select}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenGroupDialog(grp)}
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 text-destructive hover:bg-destructive/10"
                          onClick={() => deleteGroup.mutate(grp.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {grp.group_type === 'daily_menu_choice' ? (
                      <p className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg flex items-center gap-2">
                        <Sparkles className="size-4 shrink-0 text-amber-600" />
                        <span>Populates today's Sabjis automatically from Daily Menu page.</span>
                      </p>
                    ) : (
                      <div className="space-y-2 pt-1 border-t">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="space-y-0.5">
                            <span className="font-semibold text-foreground">
                              Option Items ({grp.thali_option_items.length})
                            </span>
                            <p className="text-[11px]">
                              Options linked to catalog food items update availability automatically.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs text-primary hover:text-primary gap-1 p-0 hover:bg-transparent shrink-0"
                            onClick={() => handleOpenItemDialog(grp.id)}
                          >
                            <Plus className="size-3" /> Add
                          </Button>
                        </div>

                        <div className="space-y-2 pt-1">
                          {grp.thali_option_items.map((opt: any) => (
                            <div
                              key={opt.id}
                              className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-xs transition-colors ${
                                opt.is_active ? 'bg-card' : 'bg-muted/50 border-dashed opacity-75'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <span className="font-semibold text-foreground truncate">{opt.food_items?.name || opt.label}</span>
                                {opt.food_items?.name && opt.label !== opt.food_items.name && (
                                  <span className="text-[11px] text-muted-foreground">({opt.label})</span>
                                )}
                                {opt.linked_food_item_id && (
                                  <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 px-1.5 py-0">
                                    Catalog Linked
                                  </Badge>
                                )}
                                {opt.price_delta > 0 && (
                                  <span className="text-primary font-bold">+{CURRENCY_SYMBOL}{opt.price_delta}</span>
                                )}
                                {!opt.is_active && (
                                  <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30 px-1.5 py-0">
                                    Out of Stock
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] text-muted-foreground">
                                    {opt.is_active ? 'Active' : 'Stock Off'}
                                  </span>
                                  <Switch
                                    checked={opt.is_active}
                                    onCheckedChange={(checked) =>
                                      updateItem.mutate({ id: opt.id, input: { is_active: checked } })
                                    }
                                  />
                                </div>

                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                                  onClick={() => deleteItem.mutate(opt.id)}
                                  title="Remove item"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t">
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Done Editing
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Group Create/Edit Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Option Group' : 'Add Option Group'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Group Name (e.g. Select Sabji, Choice of Roti, Accompaniments)</Label>
              <Input
                placeholder="e.g. Select Sabji"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={groupType} onValueChange={(v: any) => setGroupType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily_menu_choice">Daily Menu Choice (Dynamic Items)</SelectItem>
                  <SelectItem value="static_choice">Static Choice (e.g. Phulka Roti / Bhakhri)</SelectItem>
                  <SelectItem value="optional_addon">Optional Add-on (Extra Chhas / Sweet)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Source Category</Label>
              <Select value={targetCategoryId} onValueChange={(v) => setTargetCategoryId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category (e.g. Sabji, Breads, Snacks)..." />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Min Select</Label>
                <Input
                  type="number"
                  min={0}
                  value={minSelect}
                  onChange={(e) => setMinSelect(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Select</Label>
                <Input
                  type="number"
                  min={1}
                  value={maxSelect}
                  onChange={(e) => setMaxSelect(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs">Required Selection</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveGroup} disabled={!groupName.trim()}>
              Save Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Item Create Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Option Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Select from Catalog (optional)</Label>
              <Select
                value={selectedFoodItemId}
                onValueChange={(id) => {
                  setSelectedFoodItemId(id)
                  const picked = foodItemsCatalog?.find((f) => f.id === id)
                  if (picked) {
                    setItemLabel(picked.name)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick item (Roti, Bhakri, Chhas, etc.)..." />
                </SelectTrigger>
                <SelectContent>
                  {(foodItemsCatalog || [])
                    .filter((f) => f.kind !== 'composite')
                    .map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <span>{item.name}</span>
                        {item.categories?.name ? (
                          <span className="ml-1.5 text-xs text-muted-foreground">({item.categories.name})</span>
                        ) : null}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Item Label</Label>
              <Input
                placeholder="e.g. Phulka Roti (5 pcs) or Salad & Achar"
                value={itemLabel}
                onChange={(e) => setItemLabel(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Extra Price ({CURRENCY_SYMBOL})</Label>
              <Input
                type="number"
                min={0}
                value={itemPriceDelta}
                onChange={(e) => setItemPriceDelta(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs">Default Selection</Label>
              <Switch checked={itemIsDefault} onCheckedChange={setItemIsDefault} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setItemDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveItem} disabled={!itemLabel.trim()}>
              Save Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  )
}
