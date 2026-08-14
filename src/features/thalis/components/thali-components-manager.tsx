import { useState } from 'react'
import {
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useThaliComponents,
  useAddThaliComponent,
  useToggleThaliComponent,
  useRemoveThaliComponent,
  COMPONENT_CATEGORY_LABELS,
  type ThaliComponentCategoryType,
  type ThaliComponentWithFood,
} from '../services/thali-components-service'
import { useFoodItems } from '@/features/food-items/hooks/use-food-items'

const CATEGORIES = Object.entries(COMPONENT_CATEGORY_LABELS) as [
  ThaliComponentCategoryType,
  string,
][]

export function ThaliComponentsManager() {
  const { data: components, isPending } = useThaliComponents()
  const { data: allFoodItems } = useFoodItems()
  const addComponent = useAddThaliComponent()
  const toggleComponent = useToggleThaliComponent()
  const removeComponent = useRemoveThaliComponent()

  const [selectedCategory, setSelectedCategory] = useState<ThaliComponentCategoryType>('bread')
  const [selectedFoodItemId, setSelectedFoodItemId] = useState<string>('')

  // Already-added food item IDs
  const existingIds = new Set((components || []).map((c) => c.food_item_id))

  // Food items eligible to add (non-Thali, not already in list)
  const eligible = (allFoodItems || []).filter(
    (f) => f.kind !== 'composite' && !existingIds.has(f.id),
  )

  const handleAdd = () => {
    if (!selectedFoodItemId) return
    addComponent.mutate(
      { food_item_id: selectedFoodItemId, category_type: selectedCategory },
      { onSuccess: () => setSelectedFoodItemId('') },
    )
  }

  // Group components by category
  const grouped = CATEGORIES.map(([cat, label]) => ({
    cat,
    label,
    items: (components || [])
      .filter((c) => c.category_type === cat)
      .sort((a, b) => a.display_order - b.display_order),
  })).filter((g) => g.items.length > 0)

  return (
    <Card className="border-blue-100 dark:border-blue-950 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-100 dark:bg-blue-950 p-2 mt-0.5">
            <Globe className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">
              Global Thali Components
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              One toggle per item — changes reflect instantly across <strong>all</strong> Thali customizer drawers.
              Thali-specific items (e.g. Rotlo only in Classic Thali) are managed inside each Thali's editor.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Add item row */}
        <div className="flex flex-col gap-2 sm:flex-row bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
          <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as ThaliComponentCategoryType)}>
            <SelectTrigger className="w-full sm:w-44 bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(([cat, label]) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFoodItemId} onValueChange={setSelectedFoodItemId}>
            <SelectTrigger className="w-full sm:flex-1 bg-background text-xs">
              <SelectValue placeholder="Select item to add..." />
            </SelectTrigger>
            <SelectContent>
              {eligible.length === 0 ? (
                <div className="text-muted-foreground px-3 py-2 text-xs">All items already added</div>
              ) : (
                eligible.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs">
                    <span className="font-medium">{f.name}</span>
                    {f.categories?.name ? (
                      <span className="ml-1.5 text-muted-foreground">({f.categories.name})</span>
                    ) : null}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button
            disabled={!selectedFoodItemId || addComponent.isPending}
            onClick={handleAdd}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Add to All Thalis
          </Button>
        </div>

        {/* Info note */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Items here appear in <strong>all Thalis</strong> with a matching group category.
            Toggle <strong>Active → Off</strong> to mark an item as "Out of Stock" site-wide.
            For items specific to one Thali only, use that Thali's editor instead.
          </span>
        </div>

        {/* Component list grouped by category */}
        {isPending ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center space-y-1.5">
            <Globe className="size-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">No global components yet</p>
            <p className="text-xs text-muted-foreground">
              Add Rotli, Bhakri, Achar, Gulab Jamun… to build your global Thali component library.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(({ cat, label, items }) => (
              <div key={cat}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
                  {label}
                </h4>
                <div className="divide-y rounded-lg border bg-card">
                  {items.map((item) => (
                    <ComponentRow
                      key={item.id}
                      item={item}
                      onToggle={(is_active) =>
                        toggleComponent.mutate({ id: item.id, is_active })
                      }
                      onRemove={() => removeComponent.mutate(item.id)}
                      isTogglingId={toggleComponent.isPending ? item.id : null}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ComponentRow({
  item,
  onToggle,
  onRemove,
  isTogglingId,
}: {
  item: ThaliComponentWithFood
  onToggle: (val: boolean) => void
  onRemove: () => void
  isTogglingId: string | null
}) {
  const food = item.food_items as any
  return (
    <div
      className={`flex items-center justify-between gap-3 px-3 py-2.5 transition-colors ${
        item.is_active ? '' : 'bg-muted/30 opacity-75'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {item.is_active ? (
          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="size-3.5 text-destructive shrink-0" />
        )}
        <span className="text-sm font-medium truncate">{food?.name || '—'}</span>
        {!item.is_active && (
          <Badge
            variant="outline"
            className="text-[10px] font-medium text-destructive border-destructive/30 px-1.5 py-0 shrink-0"
          >
            Out of Stock
          </Badge>
        )}
        {food?.categories?.name ? (
          <Badge variant="secondary" className="text-[10px] font-normal px-1.5 py-0 shrink-0">
            {food.categories.name}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            {item.is_active ? 'Active' : 'Off'}
          </span>
          <Switch
            checked={item.is_active}
            disabled={isTogglingId === item.id}
            onCheckedChange={onToggle}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          title="Remove from global list"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
