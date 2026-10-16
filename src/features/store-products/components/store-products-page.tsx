import { useMemo, useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Store,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  useDeleteStoreProduct,
  useStoreProducts,
  useToggleProductAvailability,
} from '../hooks/use-store-products'
import { useAllFoodItemVariants } from '@/features/food-items/hooks/use-food-item-variants'
import { StoreProductDialog } from './store-product-dialog'
import { ProductVariantsDialog } from './product-variants-dialog'
import { CURRENCY_SYMBOL } from '@/constants'
import { isDiningPortionUnit, type StoreProduct } from '../services/store-products-service'

export function StoreProductsPage() {
  const { data: products = [], isPending } = useStoreProducts()
  const { data: allVariants = [] } = useAllFoodItemVariants()

  const toggleAvailability = useToggleProductAvailability()
  const deleteProduct = useDeleteStoreProduct()

  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all')

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<StoreProduct | null>(null)
  const [variantsProduct, setVariantsProduct] = useState<StoreProduct | null>(null)

  // Map variants by food_item_id for quick lookups
  const variantsByFoodItemId = useMemo(() => {
    const map = new Map<string, typeof allVariants>()
    for (const v of allVariants) {
      const list = map.get(v.food_item_id) || []
      list.push(v)
      map.set(v.food_item_id, list)
    }
    return map
  }, [allVariants])

  // Dynamic category tabs derived only from categories of products actually present in the store
  const categoryTabs = useMemo(() => {
    const tabs: { id: string; label: string; count: number }[] = [
      { id: 'all', label: 'All Products', count: products.length },
    ]

    const catMap = new Map<string, { id: string; label: string; count: number }>()

    for (const p of products) {
      const catId = p.category_id || p.categories?.id
      const catName = p.categories?.name
      if (catId && catName) {
        const existing = catMap.get(catId)
        if (existing) {
          existing.count += 1
        } else {
          catMap.set(catId, { id: catId, label: catName, count: 1 })
        }
      } else {
        const existing = catMap.get('uncategorized')
        if (existing) {
          existing.count += 1
        } else {
          catMap.set('uncategorized', { id: 'uncategorized', label: 'Uncategorized', count: 1 })
        }
      }
    }

    return [...tabs, ...Array.from(catMap.values())]
  }, [products])

  // Reset tab selection if the selected tab no longer exists in categoryTabs
  useEffect(() => {
    if (selectedCategoryTab !== 'all') {
      const exists = categoryTabs.some((t) => t.id === selectedCategoryTab)
      if (!exists) {
        setSelectedCategoryTab('all')
      }
    }
  }, [categoryTabs, selectedCategoryTab])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Category tab match
      let matchesCat = true
      if (selectedCategoryTab !== 'all') {
        if (selectedCategoryTab === 'uncategorized') {
          matchesCat = !item.category_id && !item.categories?.id
        } else {
          matchesCat =
            item.category_id === selectedCategoryTab ||
            item.categories?.id === selectedCategoryTab ||
            (item.categories?.slug || '').toLowerCase() === selectedCategoryTab.toLowerCase()
        }
      }

      // Status match
      let matchesStatus = true
      if (statusFilter === 'enabled') matchesStatus = item.is_available === true
      if (statusFilter === 'disabled') matchesStatus = item.is_available === false

      // Search query match
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.name_gujarati && item.name_gujarati.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))

      return matchesCat && matchesStatus && matchesSearch
    })
  }, [products, selectedCategoryTab, statusFilter, searchQuery])

  // Stats calculation
  const stats = useMemo(() => {
    const total = products.length
    const enabled = products.filter((p) => p.is_available).length
    const disabled = total - enabled
    const activeCategoriesCount = categoryTabs.length - 1
    return { total, enabled, disabled, activeCategoriesCount }
  }, [products, categoryTabs])

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Store Products
            </h1>
            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 gap-1.5 px-2.5 py-0.5 text-xs font-semibold">
              <Clock className="size-3" />
              All-Time (24x7)
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Place and manage products sold all the time (Farsan, Sweets, Nasta, Snacks, Beverages)
            independent of daily thali meal cutoffs.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingProduct(null)
            setDialogOpen(true)
          }}
          className="gap-2 shrink-0 h-11 px-5 shadow-sm"
        >
          <Plus className="size-4.5" />
          Add Product to Store
        </Button>
      </div>

      {/* ── Metric Summary Pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3.5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold font-display mt-0.5">{stats.total}</p>
        </div>
        <div className="rounded-xl border bg-emerald-50/50 border-emerald-200/80 p-3.5 shadow-sm">
          <p className="text-xs font-medium text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-600" />
            Enabled (Selling)
          </p>
          <p className="text-2xl font-bold font-display text-emerald-950 mt-0.5">
            {stats.enabled}
          </p>
        </div>
        <div className="rounded-xl border bg-muted/30 p-3.5 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <XCircle className="size-3.5 text-muted-foreground" />
            Disabled (Off-sale)
          </p>
          <p className="text-2xl font-bold font-display text-muted-foreground mt-0.5">
            {stats.disabled}
          </p>
        </div>
        <div className="rounded-xl border bg-amber-50/40 border-amber-200/60 p-3.5 shadow-sm">
          <p className="text-xs font-medium text-amber-900">Active Categories</p>
          <p className="text-2xl font-bold font-display text-amber-950 mt-0.5">
            {stats.activeCategoriesCount}
          </p>
        </div>
      </div>

      {/* ── Category Tabs & Filters ── */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          {categoryTabs.map((tab) => {
            const isActive = selectedCategoryTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategoryTab(tab.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-all shrink-0 min-h-[38px] cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            )
          })}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search store products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Status:</span>
            <div className="flex items-center rounded-lg border bg-card p-0.5">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('enabled')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'enabled'
                    ? 'bg-emerald-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Enabled ({stats.enabled})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('disabled')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === 'disabled'
                    ? 'bg-muted-foreground text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Disabled ({stats.disabled})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products List ── */}
      {isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No store products found"
          description={
            searchQuery || selectedCategoryTab !== 'all' || statusFilter !== 'all'
              ? 'Try changing your category tab or search query.'
              : 'Add dishes from your Food Items catalog to sell 24/7 (Farsan, Sweets, or Snacks) using the button above.'
          }
          className="py-16"
        />
      ) : (
        <div className="space-y-3">
          {/* Mobile-Friendly Native Cards with min 44px touch targets */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredProducts.map((item) => {
              const isEnabled = item.is_available
              const soldOut =
                Boolean(item.track_stock) &&
                item.stock_quantity != null &&
                item.stock_quantity <= 0

              return (
                <div
                  key={item.id}
                  className={`relative flex flex-col rounded-2xl border p-4 bg-card transition-all duration-200 shadow-sm hover:shadow-md ${
                    isEnabled
                      ? 'border-border'
                      : 'border-muted bg-muted/20 opacity-80'
                  }`}
                >
                  {/* Top Bar: Category, Dietary Badge & Enable/Disable Switch */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[11px] font-semibold px-2 py-0.5">
                        {item.categories?.name || 'General'}
                      </Badge>
                      {item.unit_label && !isDiningPortionUnit(item.unit_label) && (
                        <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                          {item.unit_label}
                        </Badge>
                      )}
                      {(() => {
                        const itemVariants = variantsByFoodItemId.get(item.food_item_id || item.id) || []
                        const activeVars = itemVariants.filter((v) => v.is_active)
                        if (activeVars.length > 0 && (!item.unit_label || isDiningPortionUnit(item.unit_label))) {
                          return (
                            <Badge variant="outline" className="text-[11px] font-medium text-emerald-800 bg-emerald-50 border-emerald-200">
                              {activeVars.length} Sizes
                            </Badge>
                          )
                        }
                        return null
                      })()}
                      {soldOut && (
                        <Badge variant="destructive" className="text-[10px] py-0">
                          Sold Out
                        </Badge>
                      )}
                    </div>

                    {/* Disable / Enable Toggle Switch (Primary user requirement) */}
                    <div
                      className="flex items-center gap-2 pl-2"
                      title={isEnabled ? 'Click to disable product' : 'Click to enable product'}
                    >
                      <span
                        className={`text-xs font-semibold ${
                          isEnabled ? 'text-emerald-600' : 'text-muted-foreground'
                        }`}
                      >
                        {isEnabled ? 'Selling' : 'Disabled'}
                      </span>
                      <Switch
                        checked={isEnabled}
                        disabled={toggleAvailability.isPending}
                        onCheckedChange={(checked) =>
                          toggleAvailability.mutate({
                            id: item.id,
                            is_available: checked,
                          })
                        }
                        className="data-[state=checked]:bg-emerald-600 h-6 w-11"
                        aria-label={`Toggle availability for ${item.name}`}
                      />
                    </div>
                  </div>

                  {/* Body: Thumbnail & Details */}
                  <div className="flex items-start gap-3.5 flex-1">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="size-16 rounded-xl object-cover shrink-0 border bg-muted/40"
                        loading="lazy"
                      />
                    ) : (
                      <div className="size-16 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shrink-0 text-amber-800">
                        <Store className="size-7" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-base text-foreground leading-snug truncate">
                        {item.name}
                      </h4>
                      {item.name_gujarati && (
                        <p className="text-xs text-muted-foreground font-gujarati mt-0.5 truncate">
                          {item.name_gujarati}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Pricing */}
                      {(() => {
                        const itemVariants = variantsByFoodItemId.get(item.food_item_id || item.id) || []
                        const activeVars = itemVariants.filter((v) => v.is_active)
                        const startingPrice =
                          item.price && item.price > 0
                            ? item.price
                            : activeVars.length > 0
                              ? activeVars[0].price
                              : item.price ?? 0
                        const comparePrice =
                          item.compare_price ??
                          (activeVars.length > 0 ? (activeVars[0].compare_price ?? null) : null)
                        const cleanUnit =
                          item.unit_label && !isDiningPortionUnit(item.unit_label) ? item.unit_label : null

                        return (
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-lg font-bold text-foreground tabular-nums">
                              {activeVars.length > 1 && (!item.price || item.price === 0) ? 'From ' : ''}
                              {CURRENCY_SYMBOL}
                              {startingPrice}
                            </span>
                            {comparePrice && comparePrice > startingPrice && (
                              <>
                                <span className="text-xs text-muted-foreground line-through tabular-nums">
                                  {CURRENCY_SYMBOL}
                                  {comparePrice}
                                </span>
                                <Badge className="text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                                  {Math.round(((comparePrice - startingPrice) / comparePrice) * 100)}% OFF
                                </Badge>
                              </>
                            )}
                            {cleanUnit && (
                              <span className="text-xs text-muted-foreground">
                                / {cleanUnit}
                              </span>
                            )}
                          </div>
                        )
                      })()}

                      {/* Product Variants Preview (Weight / Pack size options) */}
                      {(() => {
                        const itemVariants = variantsByFoodItemId.get(item.food_item_id || item.id) || []
                        if (itemVariants.length === 0) return null
                        const activeVars = itemVariants.filter((v) => v.is_active)

                        return (
                          <div className="mt-2.5 pt-2 border-t border-dashed space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                              <span className="flex items-center gap-1">
                                <Scale className="size-3 text-primary" />
                                {itemVariants.length} Variant{itemVariants.length > 1 ? 's' : ''}:
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                {activeVars.length} active
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {itemVariants.map((v) => (
                                <span
                                  key={v.id}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                                    v.is_active
                                      ? 'bg-primary/5 border-primary/20 text-foreground'
                                      : 'bg-muted/40 border-dashed border-muted text-muted-foreground line-through opacity-70'
                                  }`}
                                  title={v.is_active ? `${v.label}: ₹${v.price}` : `${v.label} (disabled)`}
                                >
                                  {v.label}: <strong className="text-emerald-700">₹{v.price}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Bottom Footer Actions (44px min touch target buttons) */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/80">
                    <div className="text-[11px] text-muted-foreground">
                      {item.track_stock ? (
                        <span>Stock: {item.stock_quantity} left</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">In Stock (24/7)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setVariantsProduct(item)}
                        className="h-9 px-2.5 gap-1.5 text-xs font-medium border-border/80 hover:bg-primary/5 hover:text-primary hover:border-primary/40"
                        title="Manage weight & quantity packaging variants"
                      >
                        <Scale className="size-3.5 text-primary" />
                        Variants
                        {(() => {
                          const vCount = (variantsByFoodItemId.get(item.food_item_id || item.id) || []).length
                          return vCount > 0 ? (
                            <Badge
                              variant="secondary"
                              className="ml-0.5 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary"
                            >
                              {vCount}
                            </Badge>
                          ) : null
                        })()}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingProduct(item)
                          setDialogOpen(true)
                        }}
                        className="h-9 px-3 gap-1.5 text-xs"
                      >
                        <Edit2 className="size-3.5" />
                        Edit
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingProduct(item)}
                        className="size-9 text-destructive hover:bg-destructive/10"
                        title="Remove from store"
                        aria-label="Remove from store"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <StoreProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
      />

      <ProductVariantsDialog
        open={Boolean(variantsProduct)}
        onOpenChange={(open) => !open && setVariantsProduct(null)}
        product={variantsProduct}
        toggleOnly={false}
      />

      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Remove Product from Store?"
        description={`Are you sure you want to remove "${deletingProduct?.name}" from 24/7 store offerings? The item will remain safe in your Food Items catalog, but will no longer be listed for retail sale.`}
        confirmLabel="Remove Product"
        destructive={true}
        onConfirm={async () => {
          if (deletingProduct) {
            await deleteProduct.mutateAsync(deletingProduct.id)
            setDeletingProduct(null)
          }
        }}
      />
    </div>
  )
}
