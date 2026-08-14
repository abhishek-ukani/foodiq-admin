import { useState } from 'react'
import dayjs from 'dayjs'
import { CalendarDays, ChevronDown, ChevronUp, Clock, Package, Plus, Sparkles, SlidersHorizontal, Trash2, UtensilsCrossed, Globe, Lock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/empty-state'
import { useFoodItems } from '@/features/food-items/hooks/use-food-items'
import {
  useAddMenuItem,
  useAutoPopulateMenu,
  useDailyMenu,
  useMenuItems,
  useRemoveMenuItem,
  useToggleMenuItemAvailable,
  useToggleMenuItemSpecial,
  useToggleMenuItemThaliOption,
  useUpdateMenuItemInventory,
} from '@/features/menu/hooks/use-daily-menu'
import {
  useThaliComponents,
  useAddThaliComponent,
  useToggleThaliComponent,
  useRemoveThaliComponent,
} from '../services/thali-components-service'
import { checkMenuEditLock } from '@/features/menu/utils/menu-cutoff'
import { CURRENCY_SYMBOL } from '@/constants'
import type { MealType } from '@/types/database.types'

const MEAL_TABS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

function ThaliInventoryPanel({
  item,
  onSave,
  disabled,
}: {
  item: { available_quantity: number | null; sold_quantity: number | null; cutoff_time: string | null }
  onSave: (data: { available_quantity: number | null; cutoff_time: string | null }) => void
  disabled?: boolean
}) {
  const [qty, setQty] = useState(item.available_quantity?.toString() ?? '')
  const [cutoff, setCutoff] = useState(item.cutoff_time?.slice(0, 5) ?? '')

  const soldQty = item.sold_quantity ?? 0
  const maxQty = item.available_quantity ?? null
  const pct = maxQty && maxQty > 0 ? Math.min((soldQty / maxQty) * 100, 100) : 0

  const handleBlur = () => {
    if (disabled) return
    onSave({
      available_quantity: qty.trim() ? parseInt(qty, 10) : null,
      cutoff_time: cutoff || null,
    })
  }

  return (
    <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs">
      <div className="flex flex-wrap items-end gap-5">
        <div className="space-y-1">
          <p className="font-medium text-amber-900">Max Qty (blank = unlimited)</p>
          <Input
            type="number"
            min={0}
            disabled={disabled}
            className="h-7 w-24 text-xs"
            placeholder="∞"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onBlur={handleBlur}
          />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-amber-900">
            Sold{maxQty ? ` (${soldQty} / ${maxQty})` : `: ${soldQty}`}
          </p>
          {maxQty ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-amber-100">
                <div
                  className={`h-2 rounded-full transition-all ${pct >= 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className={pct >= 80 ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                {Math.round(pct)}%
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">No cap set</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-medium text-amber-900">Item Cutoff (blank = menu cutoff)</p>
          <Input
            type="time"
            disabled={disabled}
            className="h-7 w-28 text-xs"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </div>
  )
}

export function DailyThaliChoicesCard() {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const [date, setDate] = useState(todayStr)
  const [meal, setMeal] = useState<MealType>('lunch')
  const [selectedItemId, setSelectedItemId] = useState<string>('')

  const lockStatus = checkMenuEditLock(date, meal)

  const { data: menu, isPending: menuPending } = useDailyMenu(date, meal)
  const { data: menuItems, isPending: itemsPending } = useMenuItems(menu?.id)
  const { data: allFoodItems } = useFoodItems()
  const { data: globalComponents } = useThaliComponents()

  const autoPopulate = useAutoPopulateMenu(menu?.id)
  const addItem = useAddMenuItem(menu?.id)
  const removeItem = useRemoveMenuItem(menu?.id)
  const toggleAvailable = useToggleMenuItemAvailable(menu?.id)
  const toggleSpecial = useToggleMenuItemSpecial(menu?.id)
  const toggleThaliOption = useToggleMenuItemThaliOption(menu?.id)
  const addToGlobal = useAddThaliComponent()
  const toggleGlobal = useToggleThaliComponent()
  const removeFromGlobal = useRemoveThaliComponent()
  const updateInventory = useUpdateMenuItemInventory(menu?.id)

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  // Map food_item_id → global component record for quick lookup
  const globalByFoodItemId = new Map(
    (globalComponents || []).map((c) => [c.food_item_id, c]),
  )

  // Show only non-thali daily items configured for thali
  const thaliOptionsList = (menuItems || []).filter((item) => {
    const catType = (item.food_items as any)?.categories?.category_type || 'general'
    const isNotThali = catType !== 'thali' && !item.food_items.name.toLowerCase().includes('thali')
    return isNotThali && item.is_thali_option !== false
  })

  // Filter out thalis; only allow sub-items not already in thaliOptionsList
  const availableToAdd = (allFoodItems ?? []).filter((item) => {
    const catType = (item.categories as any)?.category_type || 'general'
    const isSubItem = catType !== 'thali' && !item.name.toLowerCase().includes('thali')
    const notInMenu = !thaliOptionsList.some((mi) => mi.food_item_id === item.id)
    return item.is_available && isSubItem && notInMenu
  })

  const handleGlobalSwitch = (foodItemId: string, catType: string, checked: boolean) => {
    const existing = globalByFoodItemId.get(foodItemId)
    if (checked) {
      if (!existing) {
        const validCategories = ['bread', 'sabji', 'sweet', 'snack', 'accompaniment', 'beverage']
        const category = validCategories.includes(catType) ? catType : 'sabji'
        addToGlobal.mutate({ food_item_id: foodItemId, category_type: category as any })
      }
    } else {
      if (existing) {
        removeFromGlobal.mutate(existing.id)
      }
    }
  }

  return (
    <Card className="border-emerald-100 dark:border-emerald-950 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-emerald-600" />
              Daily Items Manager
            </CardTitle>
            <CardDescription>
              Manage which items are available inside Thalis today.
              Toggle <strong className="text-blue-600">In Global</strong> to make an item permanently available across all Thalis every day.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-muted-foreground size-4" aria-hidden />
              <Input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-36 h-9"
              />
            </div>
            <Tabs value={meal} onValueChange={(v) => setMeal(v as MealType)}>
              <TabsList className="h-9">
                {MEAL_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="text-xs px-3 py-1">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {lockStatus.isLocked && (
          <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-950 font-medium">
            <Lock className="size-4 text-amber-600 shrink-0" />
            <span>{lockStatus.reason}</span>
          </div>
        )}

        {/* Add item to today */}
        <div className={`flex flex-col gap-3 sm:flex-row bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 ${lockStatus.isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
          <Select disabled={lockStatus.isLocked} value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="w-full sm:max-w-md bg-background">
              <SelectValue placeholder="Select Sabji, Roti, Sweet or Farsan for Thali..." />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.length === 0 ? (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  No available sub-items to add
                </div>
              ) : (
                availableToAdd.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <span className="font-medium">{item.name}</span>
                    {item.categories?.name ? (
                      <span className="ml-2 text-xs text-muted-foreground">({item.categories.name})</span>
                    ) : null}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button
            disabled={lockStatus.isLocked || !selectedItemId || !menu || addItem.isPending}
            onClick={() => {
              if (selectedItemId) {
                addItem.mutate(
                  { foodItemId: selectedItemId, options: { is_thali_option: true, is_standalone_sale: false } },
                  { onSuccess: () => setSelectedItemId('') },
                )
              }
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
          >
            <Plus className="size-4" aria-hidden />
            Add to Today
          </Button>

          <Button
            disabled={lockStatus.isLocked || !menu || autoPopulate.isPending}
            variant="outline"
            onClick={() => autoPopulate.mutate()}
            className="gap-2 text-xs"
          >
            <Sparkles className="size-3.5 text-amber-500" aria-hidden />
            Auto-Populate Thalis
          </Button>

        </div>

        {/* Item list */}
        {menuPending || itemsPending ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : !thaliOptionsList.length ? (
          <EmptyState
            icon={UtensilsCrossed}
            title="No Thali choices added for this date & meal"
            description="Use the selector above to add today's Sabjis, Rotis, and Sweets for customer Thali selection."
            className="border-dashed py-8"
          />
        ) : (
          <div className="divide-y rounded-lg border bg-card">
            {thaliOptionsList.map((item) => {
              const catType = (item.food_items as any)?.categories?.category_type || 'sabji'
              const globalComponent = globalByFoodItemId.get(item.food_item_id)
              const isInGlobal = Boolean(globalComponent)

              return (
                <div key={item.id} className="flex flex-col p-3">
                  {/* Main row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{item.food_items.name}</p>
                        {(item.food_items as any).categories?.name ? (
                          <Badge variant="secondary" className="text-[10px] font-normal px-2 py-0">
                            {(item.food_items as any).categories.name}
                          </Badge>
                        ) : null}
                        {item.available_quantity !== null &&
                          (item.sold_quantity ?? 0) >= item.available_quantity && (
                            <Badge variant="destructive" className="text-[10px] py-0">Sold Out</Badge>
                          )}
                        {item.cutoff_time ? (
                          <Badge variant="secondary" className="text-[10px] py-0 gap-1">
                            <Clock className="size-2.5" />
                            {item.cutoff_time.slice(0, 5)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Price: {CURRENCY_SYMBOL}{item.food_items.offer_price ?? item.food_items.price}
                        {item.available_quantity ? (
                          <span className="ml-2 text-amber-700">
                            {item.sold_quantity ?? 0}/{item.available_quantity} sold
                          </span>
                        ) : null}
                      </p>
                    </div>

                  <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
                    {/* Available toggle */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Available</span>
                      <Switch
                        checked={item.is_available}
                        disabled={lockStatus.isLocked}
                        onCheckedChange={(checked) =>
                          toggleAvailable.mutate({ id: item.id, is_available: checked })
                        }
                      />
                    </div>

                    {/* Special toggle */}
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-amber-500" />
                      <span className="text-xs text-amber-700 font-medium">Special</span>
                      <Switch
                        checked={item.is_special}
                        disabled={lockStatus.isLocked}
                        onCheckedChange={(checked) =>
                          toggleSpecial.mutate({ id: item.id, is_special: checked })
                        }
                      />
                    </div>

                    {/* In Global toggle */}
                    <div className="flex items-center gap-1.5">
                      <Globe className="size-3.5 text-blue-500" />
                      <span className="text-xs text-blue-600 font-medium">In Global</span>
                      <Switch
                        checked={isInGlobal}
                        disabled={lockStatus.isLocked || addToGlobal.isPending || removeFromGlobal.isPending}
                        onCheckedChange={(checked) =>
                          handleGlobalSwitch(item.food_item_id, catType, checked)
                        }
                      />
                    </div>

                    {/* Inventory expand toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-amber-600 hover:bg-amber-50 relative"
                      title="Inventory controls"
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    >
                      <Package className="size-4" aria-hidden />
                      {expandedItemId === item.id
                        ? <ChevronUp className="size-3 absolute bottom-0.5 right-0.5" />
                        : <ChevronDown className="size-3 absolute bottom-0.5 right-0.5" />}
                    </Button>

                    {/* Remove from today */}
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={lockStatus.isLocked}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      aria-label="Remove item"
                      onClick={() => {
                        if (item.is_standalone_sale) {
                          toggleThaliOption.mutate({ id: item.id, is_thali_option: false })
                        } else {
                          removeItem.mutate(item.id)
                        }
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                  </div>

                  {/* Inventory panel */}
                  {expandedItemId === item.id && (
                    <ThaliInventoryPanel
                      item={item}
                      disabled={lockStatus.isLocked}
                      onSave={(data) => updateInventory.mutate({ id: item.id, ...data })}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
