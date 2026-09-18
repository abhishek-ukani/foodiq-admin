import { useEffect, useMemo, useRef, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Store, UtensilsCrossed, Search, X } from 'lucide-react'
import { useCategories } from '@/features/menu/hooks/use-categories'
import { ItemVariantsManager } from '@/features/food-items/components/item-variants-manager'
import {
  useAddFoodItemToStore,
  useUnplacedFoodItems,
  useUpdateStoreProduct,
} from '../hooks/use-store-products'
import type { StoreProduct } from '../services/store-products-service'

type FormData = {
  food_item_id: string
  category_id: string
  is_available: boolean
  track_stock: boolean
  stock_quantity: number
}

export function StoreProductDialog({
  open,
  onOpenChange,
  product,
  defaultCategoryId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: StoreProduct | null
  defaultCategoryId?: string
}) {
  const { data: categories = [] } = useCategories()
  const { data: unplacedItems = [] } = useUnplacedFoodItems()
  const addMutation = useAddFoodItemToStore()
  const updateMutation = useUpdateStoreProduct()

  const [dishSearch, setDishSearch] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close search suggestions on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter categories to retail/store categories (Farsan, Sweets, Snacks, Beverages, Add-ons)
  const storeCategories = useMemo(() => {
    const matched = categories.filter((c) => {
      if (!c.is_active) return false
      const slug = (c.slug || '').toLowerCase()
      const type = (c.category_type || '').toLowerCase()
      return (
        type === 'snack' ||
        type === 'sweet' ||
        type === 'beverage' ||
        slug.includes('farsan') ||
        slug.includes('sweet') ||
        slug.includes('snack') ||
        slug.includes('nasta') ||
        slug.includes('beverage') ||
        slug.includes('add-on')
      )
    })
    return matched.length > 0 ? matched : categories.filter((c) => c.is_active)
  }, [categories])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      food_item_id: '',
      category_id: defaultCategoryId || '',
      is_available: true,
      track_stock: false,
      stock_quantity: 50,
    },
  })

  const selectedFoodItemId = watch('food_item_id')
  const selectedCat = watch('category_id')
  const isAvailable = watch('is_available')
  const trackStock = watch('track_stock')

  // Find the selected food item from the unplaced list for display
  const selectedUnplacedItem = useMemo(() => {
    if (product) return null
    return unplacedItems.find((item) => item.id === selectedFoodItemId) || null
  }, [product, unplacedItems, selectedFoodItemId])

  // Filter unplaced items by search query
  const filteredUnplacedItems = useMemo(() => {
    const q = dishSearch.trim().toLowerCase()
    if (!q) return unplacedItems
    return unplacedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.name_gujarati && item.name_gujarati.toLowerCase().includes(q)) ||
        (item.categories?.name && item.categories.name.toLowerCase().includes(q)),
    )
  }, [unplacedItems, dishSearch])

  // Strictly give max 5 suggestions based on search keywords
  const topSuggestions = useMemo(() => {
    return filteredUnplacedItems.slice(0, 5)
  }, [filteredUnplacedItems])

  useEffect(() => {
    if (open) {
      setDishSearch('')
      setIsSearchFocused(false)
      if (product) {
        // Edit mode for existing store product
        reset({
          food_item_id: product.id,
          category_id: product.category_id || storeCategories[0]?.id || '',
          is_available: product.is_available,
          track_stock: product.track_stock,
          stock_quantity: product.stock_quantity || 0,
        })
      } else {
        // Add mode: pick from existing food items
        const defaultCat =
          defaultCategoryId ||
          storeCategories.find(
            (c) =>
              c.slug.includes('farsan') ||
              c.slug.includes('sweet') ||
              c.slug.includes('snack'),
          )?.id ||
          storeCategories[0]?.id ||
          ''

        reset({
          food_item_id: '',
          category_id: defaultCat,
          is_available: true,
          track_stock: false,
          stock_quantity: 50,
        })
      }
    }
  }, [open, product, defaultCategoryId, storeCategories, reset])

  // When admin selects a dish in Add Mode
  const handleSelectFoodItem = (itemId: string) => {
    setValue('food_item_id', itemId)
    setIsSearchFocused(false)
    setDishSearch('')
    const found = unplacedItems.find((i) => i.id === itemId)
    if (found) {
      setValue('track_stock', found.track_stock ?? false)
      setValue('stock_quantity', found.stock_quantity ?? 50)
    }
  }

  const handleClearSelectedFoodItem = () => {
    setValue('food_item_id', '')
    setDishSearch('')
    setIsSearchFocused(true)
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 50)
  }

  const onSubmit = async (values: FormData) => {
    if (product) {
      // Update existing store product settings
      await updateMutation.mutateAsync({
        id: product.id,
        input: {
          category_id: values.category_id || null,
          is_available: values.is_available,
          track_stock: values.track_stock,
          stock_quantity: values.track_stock ? Number(values.stock_quantity) : 0,
        },
      })
    } else {
      if (!values.food_item_id) return
      const foundItem = unplacedItems.find((i) => i.id === values.food_item_id)
      // Place existing food item into store offerings
      await addMutation.mutateAsync({
        foodItemId: values.food_item_id,
        categoryId: values.category_id,
        price: foundItem?.price ?? 0,
        comparePrice: foundItem?.compare_price ?? null,
        unitLabel: foundItem?.unit_label ?? null,
        isAvailable: values.is_available,
        trackStock: values.track_stock,
        stockQuantity: values.track_stock ? Number(values.stock_quantity) : 0,
      })
    }
    onOpenChange(false)
  }

  const isAddMode = !product

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-7">
        <DialogHeader>
          <DialogTitle className="text-xl font-display flex items-center gap-2">
            <Store className="size-5 text-primary" />
            {isAddMode ? 'Add Food Item to Store' : 'Edit Store Product'}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            {isAddMode
              ? 'Select an existing dish from your Food Items catalog to make it available for 24/7 store selling.'
              : 'Adjust retail store pricing, pack size, stock, and availability for this item.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* ── 1. Food Item Picker / Identity Card ── */}
          {isAddMode ? (
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Select Dish from Catalog *</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  {unplacedItems.length} items available
                </span>
              </Label>

              {unplacedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed p-4 text-center bg-muted/20">
                  <p className="text-xs text-muted-foreground">
                    All single dishes are already added to Store Products. To add new dishes, create them first in the Food Items section.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Search Input with 5 Suggestions Dropdown */}
                  <div ref={searchContainerRef} className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Type keywords to search dishes (e.g., Thali, Gathiya, Sev, Roti)..."
                        value={dishSearch}
                        onChange={(e) => {
                          setDishSearch(e.target.value)
                          setIsSearchFocused(true)
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        className="h-11 pl-9 pr-9 text-xs sm:text-sm"
                      />
                      {dishSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setDishSearch('')
                            searchInputRef.current?.focus()
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                          title="Clear search"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Suggestions Box (Max 5 items) */}
                    {isSearchFocused && (
                      <div className="absolute left-0 right-0 z-50 mt-1.5 bg-popover border rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95">
                        <div className="px-3 py-1.5 bg-muted/50 border-b flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                          <span>
                            {dishSearch.trim()
                              ? `Suggestions (${topSuggestions.length}${filteredUnplacedItems.length > 5 ? ` of ${filteredUnplacedItems.length}` : ''})`
                              : `Suggestions (top ${topSuggestions.length})`}
                          </span>
                          {filteredUnplacedItems.length > 5 && (
                            <span className="text-[10px] text-primary">
                              Type keywords to narrow
                            </span>
                          )}
                        </div>

                        {topSuggestions.length > 0 ? (
                          <div className="divide-y divide-border/60 max-h-64 overflow-y-auto">
                            {topSuggestions.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelectFoodItem(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors min-h-[48px] hover:bg-accent/70 ${
                                  selectedFoodItemId === item.id ? 'bg-primary/5 font-medium' : ''
                                }`}
                              >
                                {item.image_url ? (
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="size-8 rounded-lg object-cover border shrink-0"
                                  />
                                ) : (
                                  <div className="size-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                    <UtensilsCrossed className="size-4" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-semibold text-foreground truncate">
                                      {item.name}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                                      ₹{item.price}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                                    <span className="truncate">{item.categories?.name || 'Uncategorized'}</span>
                                    {item.name_gujarati && (
                                      <>
                                        <span>•</span>
                                        <span className="font-gujarati truncate">{item.name_gujarati}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs text-muted-foreground">
                              No dishes found matching <span className="font-semibold text-foreground">"{dishSearch}"</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Item Preview Pill */}
                  {selectedUnplacedItem ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl border bg-emerald-50/50 border-emerald-300/80 shadow-xs">
                      {selectedUnplacedItem.image_url ? (
                        <img
                          src={selectedUnplacedItem.image_url}
                          alt={selectedUnplacedItem.name}
                          className="size-12 rounded-lg object-cover border shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded-lg bg-emerald-100/70 border border-emerald-200 flex items-center justify-center text-emerald-800 shrink-0">
                          <UtensilsCrossed className="size-5" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {selectedUnplacedItem.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] bg-white border-emerald-300 text-emerald-800 shrink-0">
                            Ready to Place
                          </Badge>
                        </div>
                        {selectedUnplacedItem.name_gujarati && (
                          <p className="text-xs text-muted-foreground font-gujarati mt-0.5">
                            {selectedUnplacedItem.name_gujarati}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {selectedUnplacedItem.categories?.name || 'Uncategorized'} • Base Catalog Price: ₹{selectedUnplacedItem.price}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelectedFoodItem}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive px-2.5 shrink-0"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Type keywords above to see 5 suggestions, then pick a dish to configure.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode: Product Banner */
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="size-14 rounded-lg object-cover border shrink-0"
                />
              ) : (
                <div className="size-14 rounded-lg bg-amber-100/60 border border-amber-200 flex items-center justify-center shrink-0 text-amber-800">
                  <Store className="size-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-foreground truncate">{product.name}</h4>
                  <Badge variant="secondary" className="text-[10px]">
                    Catalog Dish
                  </Badge>
                </div>
                {product.name_gujarati && (
                  <p className="text-xs text-muted-foreground font-gujarati mt-0.5">
                    {product.name_gujarati}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  Dish recipe & info are managed in Food Items catalog.
                </p>
              </div>
            </div>
          )}

          {/* ── 2. Sell on Store (Active / Live) Toggle ── */}
          <div className="flex items-center justify-between p-3 rounded-xl border bg-amber-50/40 border-amber-200/80">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-amber-950">
                Sell on Store (Active / Live)
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800">
                {isAvailable
                  ? 'Product is active and visible to customers 24/7.'
                  : 'Product is disabled and marked unavailable on storefront.'}
              </p>
            </div>
            <Switch
              checked={isAvailable}
              onCheckedChange={(checked) => setValue('is_available', checked)}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>

          {/* ── 3. Store Category ── */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Store Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedCat}
              onValueChange={(val) => setValue('category_id', val)}
            >
              <SelectTrigger className="h-11 text-xs sm:text-sm">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {storeCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── 5. Inventory Management ── */}
          <div className="rounded-xl border p-3.5 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium">Track Stock & Inventory</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  Limit 24/7 store orders to available inventory quantity
                </p>
              </div>
              <Switch
                checked={trackStock}
                onCheckedChange={(checked) => setValue('track_stock', checked)}
              />
            </div>

            {trackStock && (
              <div className="pt-2 border-t flex items-center justify-between gap-3">
                <Label htmlFor="prod-stock" className="text-xs whitespace-nowrap">
                  Available Quantity:
                </Label>
                <Input
                  id="prod-stock"
                  type="number"
                  min="0"
                  className="w-32 h-10 text-xs text-center"
                  {...register('stock_quantity', { valueAsNumber: true })}
                />
              </div>
            )}
          </div>

          {/* ── 6. Product Packaging Variants (when editing) ── */}
          {product && (
            <ItemVariantsManager
              foodItemId={product.id}
              defaultPrice={product.price}
            />
          )}

          {/* ── Dialog Footer ── */}
          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 min-w-[80px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (isAddMode && !selectedFoodItemId)}
              className="h-11 min-w-[120px]"
            >
              {isAddMode ? 'Add to Store' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
