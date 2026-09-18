import { useState } from 'react'
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Scale,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useCreateFoodItemVariant,
  useDeleteFoodItemVariant,
  useFoodItemVariants,
  useToggleVariantActive,
  useUpdateFoodItemVariant,
} from '../hooks/use-food-item-variants'
import { CURRENCY_SYMBOL } from '@/constants'
import type { FoodItemVariant } from '../services/food-item-variants-service'
import type { UnitType } from '@/types/database.types'

// Helpful preset buttons tailored for Indian cuisine, thali dishes, farsan & sweets
const PRESETS: { label: string; unit_type: UnitType; quantity: number }[] = [
  { label: '250 gm', unit_type: 'gm', quantity: 250 },
  { label: '500 gm', unit_type: 'gm', quantity: 500 },
  { label: '1 kg', unit_type: 'kg', quantity: 1 },
  { label: '1 Portion', unit_type: 'pc', quantity: 1 },
  { label: '5 pcs', unit_type: 'pc', quantity: 5 },
  { label: '10 pcs', unit_type: 'pc', quantity: 10 },
]

export function ItemVariantsManager({
  foodItemId,
  defaultPrice = 0,
}: {
  foodItemId: string
  defaultPrice?: number
}) {
  const { data: variants = [], isPending } = useFoodItemVariants(foodItemId)
  const createMutation = useCreateFoodItemVariant(foodItemId)
  const updateMutation = useUpdateFoodItemVariant(foodItemId)
  const toggleMutation = useToggleVariantActive(foodItemId)
  const deleteMutation = useDeleteFoodItemVariant(foodItemId)

  // New variant form state
  const [label, setLabel] = useState('')
  const [unitType, setUnitType] = useState<UnitType>('gm')
  const [quantity, setQuantity] = useState<number | ''>(500)
  const [price, setPrice] = useState<number | ''>(defaultPrice || '')
  const [comparePrice, setComparePrice] = useState<number | ''>('')
  const [showAddForm, setShowAddForm] = useState(false)

  // Editing existing variant state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<number | ''>('')
  const [editComparePrice, setEditComparePrice] = useState<number | ''>('')
  const [editLabel, setEditLabel] = useState('')

  const handleApplyPreset = (preset: {
    label: string
    unit_type: UnitType
    quantity: number
  }) => {
    setLabel(preset.label)
    setUnitType(preset.unit_type)
    setQuantity(preset.quantity)
    setShowAddForm(true)
  }

  const handleAddVariant = () => {
    const trimmedLabel = label.trim()
    const numericPrice = Number(price)
    const numericQty = Number(quantity)

    if (!trimmedLabel || Number.isNaN(numericPrice) || numericPrice < 0) return

    createMutation.mutate(
      {
        label: trimmedLabel,
        unit_type: unitType,
        quantity: Number.isNaN(numericQty) || numericQty <= 0 ? 1 : numericQty,
        price: numericPrice,
        compare_price: comparePrice === '' ? null : Number(comparePrice),
        cost_price: null,
        stock_status: 'IN_STOCK',
        stock_quantity: 50,
        is_active: true,
        display_order: variants.length,
      },
      {
        onSuccess: () => {
          setLabel('')
          setPrice(defaultPrice || '')
          setComparePrice('')
          setQuantity(500)
          setShowAddForm(false)
        },
      },
    )
  }

  const startEdit = (v: FoodItemVariant) => {
    setEditingId(v.id)
    setEditPrice(v.price)
    setEditComparePrice(v.compare_price ?? '')
    setEditLabel(v.label)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditPrice('')
    setEditComparePrice('')
    setEditLabel('')
  }

  const saveEdit = (id: string) => {
    const numPrice = Number(editPrice)
    if (Number.isNaN(numPrice) || numPrice < 0) return

    updateMutation.mutate(
      {
        id,
        input: {
          label: editLabel.trim(),
          price: numPrice,
          compare_price: editComparePrice === '' ? null : Number(editComparePrice),
        },
      },
      {
        onSuccess: () => cancelEdit(),
      },
    )
  }

  const activeCount = variants.filter((v) => v.is_active).length

  return (
    <div className="space-y-3.5 rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Scale className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                Product Variants (Weight & Pack Sizes)
              </h3>
              {variants.length > 0 && (
                <Badge
                  variant={activeCount > 0 ? 'default' : 'secondary'}
                  className="text-[10px] px-2 py-0.5"
                >
                  {activeCount} of {variants.length} Active
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sell by weight (e.g. 250 gm, 500 gm, 1 kg) with individual pricing & availability toggles.
            </p>
          </div>
        </div>

        {!showAddForm && (
          <Button
            type="button"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="h-9 px-3 text-xs gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-3.5" />
            Add Variant
          </Button>
        )}
      </div>

      {/* ── Quick Preset Chips ── */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Sparkles className="size-3 text-primary" />
          Quick Weight Presets:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/30 hover:bg-primary/10 hover:border-primary/40 px-2.5 py-1 text-xs font-medium text-foreground transition-colors min-h-[34px]"
            >
              <Plus className="size-3 text-primary" />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Add Variant Form (Collapsible) ── */}
      {showAddForm && (
        <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3 animate-in fade-in-0 zoom-in-98">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" />
              Configure New Variant
            </p>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold">Variant Label *</Label>
              <Input
                placeholder="e.g. 500 gm"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-10 text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold">Unit Type</Label>
              <Select
                value={unitType}
                onValueChange={(val: UnitType) => setUnitType(val)}
              >
                <SelectTrigger className="h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gm">gm (Grams)</SelectItem>
                  <SelectItem value="kg">kg (Kilograms)</SelectItem>
                  <SelectItem value="pc">pc (Pieces / Portions)</SelectItem>
                  <SelectItem value="ml">ml (Milliliters)</SelectItem>
                  <SelectItem value="ltr">ltr (Liters)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold">Weight / Quantity</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 500"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="h-10 text-xs sm:text-sm"
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <Label className="text-xs font-semibold">Selling Price ({CURRENCY_SYMBOL}) *</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="h-10 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-400"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1">
            <div className="w-full sm:w-56 space-y-1.5 min-w-0">
              <Label className="text-xs text-muted-foreground font-medium">
                Original MRP ({CURRENCY_SYMBOL}, optional)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="Strike price"
                value={comparePrice}
                onChange={(e) =>
                  setComparePrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="h-10 text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto pt-1 sm:pt-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-3 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddVariant}
                disabled={!label.trim() || price === '' || createMutation.isPending}
                className="h-10 px-4 text-xs font-semibold min-w-[110px]"
              >
                {createMutation.isPending ? 'Adding...' : 'Save Variant'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Existing Variants List ── */}
      {isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-xl" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
      ) : variants.length === 0 ? (
        <div className="rounded-xl border border-dashed p-5 text-center bg-muted/15 space-y-2">
          <Scale className="size-6 text-muted-foreground/60 mx-auto" />
          <p className="text-xs font-medium text-foreground">No variants configured yet</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            Click any of the quick presets above (e.g. <strong>250 gm</strong>, <strong>500 gm</strong>, or <strong>1 kg</strong>) to set up packaging options for direct sale.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {variants.map((v) => {
            const isEditing = editingId === v.id
            const isActive = v.is_active

            return (
              <div
                key={v.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-card border-border shadow-2xs'
                    : 'bg-muted/30 border-dashed border-muted-foreground/30 opacity-75'
                }`}
              >
                {/* Left: Info or Edit Inputs */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`size-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                      isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {v.unit_type}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="h-8 text-xs w-28"
                        placeholder="Label"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{CURRENCY_SYMBOL}</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editPrice}
                          onChange={(e) =>
                            setEditPrice(e.target.value === '' ? '' : Number(e.target.value))
                          }
                          className="h-8 text-xs w-20"
                          placeholder="Price"
                        />
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={editComparePrice}
                        onChange={(e) =>
                          setEditComparePrice(
                            e.target.value === '' ? '' : Number(e.target.value),
                          )
                        }
                        className="h-8 text-xs w-20 text-muted-foreground"
                        placeholder="MRP"
                      />
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {v.label}
                        </span>
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className={`text-[10px] px-2 py-0 ${
                            isActive
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-muted-foreground/20 text-muted-foreground'
                          }`}
                        >
                          {isActive ? 'Available' : 'Disabled'}
                        </Badge>
                      </div>

                      <div className="flex items-baseline gap-2 mt-0.5 text-xs">
                        <span className="font-bold text-foreground">
                          {CURRENCY_SYMBOL}
                          {v.price}
                        </span>
                        {v.compare_price && v.compare_price > v.price && (
                          <span className="text-muted-foreground text-[11px] line-through">
                            {CURRENCY_SYMBOL}
                            {v.compare_price}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          ({v.quantity} {v.unit_type})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions & Enable/Disable Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
                  {/* Enable / Disable Switch (Primary feature requested) */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? 'text-emerald-700' : 'text-muted-foreground'
                      }`}
                    >
                      {isActive ? 'Active' : 'Off'}
                    </span>
                    <Switch
                      checked={isActive}
                      disabled={toggleMutation.isPending}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: v.id, isActive: checked })
                      }
                      className="data-[state=checked]:bg-emerald-600"
                      aria-label={`Toggle availability for ${v.label}`}
                    />
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => saveEdit(v.id)}
                          disabled={updateMutation.isPending}
                          className="size-8 text-emerald-700 hover:bg-emerald-50"
                          title="Save changes"
                        >
                          <Check className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={cancelEdit}
                          className="size-8 text-muted-foreground"
                          title="Cancel edit"
                        >
                          <X className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(v)}
                          className="size-8 text-muted-foreground hover:text-foreground"
                          title="Edit price or label"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Delete variant "${v.label}"?`)) {
                              deleteMutation.mutate(v.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="size-8 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                          title="Delete variant"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
