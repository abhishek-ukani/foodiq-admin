import { useState, useMemo, useRef, useEffect } from 'react'
import dayjs from 'dayjs'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Plus,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  UtensilsCrossed,
  Globe,
  Lock,
  Search,
  X,
  ChevronsUpDown,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  useRemoveThaliComponent,
  COMPONENT_CATEGORY_LABELS,
  type ThaliComponentCategoryType,
} from '../services/thali-components-service'
import { checkMenuEditLock } from '@/features/menu/utils/menu-cutoff'
import { CURRENCY_SYMBOL } from '@/constants'
import type { MealType } from '@/types/database.types'
import type { FoodItemWithCategory } from '@/features/food-items/services/food-items-service'

const MEAL_TABS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

/** Order in which Thali sections appear in the Daily Items manager */
const THALI_SECTION_ORDER: ThaliComponentCategoryType[] = [
  'sabji',
  'bread',
  'rice',
  'sweet',
  'accompaniment',
  'beverage',
  'snack',
]

/**
 * Maps any food item to its appropriate Thali section.
 * Returns null if the item should NOT be included in Thalis
 * (e.g., Farsan, whole Thali meal combos, Add-ons/Extras).
 */
export function mapItemToThaliSection(
  item: FoodItemWithCategory,
): ThaliComponentCategoryType | null {
  const catName = item.categories?.name?.toLowerCase() || ''
  const catType = (item.categories?.category_type || '').toLowerCase()
  const itemName = item.name.toLowerCase()

  // 1. Exclude items that should NEVER be inside Thali sub-options:
  // - Whole Thali combos themselves
  if (catType === 'thali' || catName.includes('thali') || itemName.includes('thali')) {
    return null
  }
  // - Farsan (user instruction: "farsan is not included in the thali so it's never be there")
  if (catName.includes('farsan') || itemName.includes('gathiya')) {
    return null
  }
  // - Add-ons & Extras
  if (catName.includes('add-on') || catName.includes('extra')) {
    return null
  }

  // 2. Direct category_type match (from categories table)
  if (catType === 'sabji') return 'sabji'
  if (catType === 'bread') return 'bread'
  if (catType === 'rice') return 'rice'
  if (catType === 'sweet') return 'sweet'
  if (catType === 'beverage') return 'beverage'
  if (catType === 'accompaniment') return 'accompaniment'
  if (catType === 'snack') return 'snack'

  // 3. Category name heuristics (for categories with category_type='general' or custom names)
  if (
    catName.includes('sabji') ||
    catName.includes('shabji') ||
    catName.includes('sabzi') ||
    catName.includes('shaak') ||
    catName.includes('curry')
  ) {
    return 'sabji'
  }
  if (
    catName.includes('roti') ||
    catName.includes('rotli') ||
    catName.includes('rotla') ||
    catName.includes('bread') ||
    catName.includes('puri') ||
    catName.includes('bhakhri')
  ) {
    return 'bread'
  }
  if (
    catName.includes('rice') ||
    catName.includes('bhat') ||
    catName.includes('dal') ||
    catName.includes('khichdi') ||
    catName.includes('kadhi')
  ) {
    return 'rice'
  }
  if (catName.includes('sweet') || catName.includes('mithai') || catName.includes('dessert')) {
    return 'sweet'
  }
  if (
    catName.includes('sambhar') ||
    catName.includes('salad') ||
    catName.includes('pickle') ||
    catName.includes('aachar') ||
    catName.includes('accompaniment') ||
    catName.includes('chutney')
  ) {
    return 'accompaniment'
  }
  if (
    catName.includes('beverage') ||
    catName.includes('chaas') ||
    catName.includes('chhash') ||
    catName.includes('drink') ||
    catName.includes('buttermilk')
  ) {
    return 'beverage'
  }
  if (catName.includes('snack')) {
    return 'snack'
  }

  // 4. Item Name heuristics (when category is null or general)
  if (
    itemName.includes('chhash') ||
    itemName.includes('chaas') ||
    itemName.includes('buttermilk') ||
    itemName.includes('lassi')
  ) {
    return 'beverage'
  }
  if (
    itemName.includes('aachar') ||
    itemName.includes('pickle') ||
    itemName.includes('salad') ||
    itemName.includes('gud') ||
    itemName.includes('jaggery') ||
    itemName.includes('sambhar') ||
    itemName.includes('chutney')
  ) {
    return 'accompaniment'
  }
  if (
    itemName.includes('roti') ||
    itemName.includes('rotli') ||
    itemName.includes('rotla') ||
    itemName.includes('puri') ||
    itemName.includes('bhakhri') ||
    itemName.includes('paratha')
  ) {
    return 'bread'
  }
  if (
    itemName.includes('mahaprashad') ||
    itemName.includes('prashad') ||
    itemName.includes('mithai') ||
    itemName.includes('sweet') ||
    itemName.includes('halwa') ||
    itemName.includes('ladoo') ||
    itemName.includes('shrikhand')
  ) {
    return 'sweet'
  }
  if (
    itemName.includes('shaak') ||
    itemName.includes('sabji') ||
    itemName.includes('sabzi') ||
    itemName.includes('masala') ||
    itemName.includes('bataka') ||
    itemName.includes('tameta') ||
    itemName.includes('paneer') ||
    itemName.includes('dudhi') ||
    itemName.includes('ringna') ||
    itemName.includes('bhinda') ||
    itemName.includes('karela') ||
    itemName.includes('guvar') ||
    itemName.includes('chana')
  ) {
    return 'sabji'
  }
  if (
    itemName.includes('dal') ||
    itemName.includes('bhat') ||
    itemName.includes('rice') ||
    itemName.includes('khichdi') ||
    itemName.includes('kadhi')
  ) {
    return 'rice'
  }

  return null
}

// ─── Searchable Dropdown for a Section ──────────────────────────────

interface SectionSearchableDropdownProps {
  sectionKey: ThaliComponentCategoryType
  items: FoodItemWithCategory[]
  disabled: boolean
  onAdd: (itemId: string) => void
  isAdding: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function SectionSearchableDropdown({
  sectionKey,
  items,
  disabled,
  onAdd,
  isAdding,
  isOpen,
  onOpenChange,
}: SectionSearchableDropdownProps) {
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onOpenChange(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onOpenChange])

  // Filter items based on user search
  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.categories?.name && item.categories.name.toLowerCase().includes(q)),
    )
  }, [items, search])

  const label = COMPONENT_CATEGORY_LABELS[sectionKey]
  const cleanLabel = label.replace(/^.+?\s/, '') // remove emoji

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled || items.length === 0}
        onClick={() => {
          if (disabled || items.length === 0) return
          const nextOpen = !isOpen
          onOpenChange(nextOpen)
          if (nextOpen) {
            setTimeout(() => inputRef.current?.focus(), 60)
          }
        }}
        className={`flex w-full sm:w-auto sm:min-w-[210px] items-center justify-between gap-2.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium shadow-xs transition-colors hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring min-h-[40px] sm:min-h-[36px] ${
          items.length === 0
            ? 'opacity-60 cursor-not-allowed bg-muted/40 border-muted'
            : 'cursor-pointer hover:border-emerald-300'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate text-foreground/90">
          <Plus className="size-3.5 text-emerald-600 shrink-0" />
          {items.length === 0 ? (
            <span className="text-muted-foreground">All {cleanLabel} added</span>
          ) : (
            <span>Add {cleanLabel}…</span>
          )}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {items.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] font-semibold px-1.5 py-0 h-4 bg-emerald-100 text-emerald-800"
            >
              {items.length}
            </Badge>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-full sm:w-80 rounded-xl border bg-popover text-popover-foreground shadow-2xl animate-in fade-in-0 zoom-in-95 ring-1 ring-black/5">
          {/* Search Header */}
          <div className="flex items-center gap-2 border-b p-2.5 bg-muted/20 rounded-t-xl">
            <Search className="size-4 text-muted-foreground shrink-0 ml-1" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${cleanLabel}…`}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground h-8"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Items Options List */}
          <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No matching {cleanLabel} items found
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isAdding}
                  onClick={() => {
                    onAdd(item.id)
                    setSearch('')
                    onOpenChange(false)
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs text-left transition-colors hover:bg-emerald-50 hover:text-emerald-950 focus:bg-emerald-50 focus:outline-none min-h-[44px] cursor-pointer"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-medium text-emerald-700">
                        {CURRENCY_SYMBOL}
                        {item.compare_price ?? item.price}
                      </span>
                      {item.categories?.name && (
                        <span>• {item.categories.name}</span>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 shrink-0 text-emerald-800 font-semibold text-xs bg-emerald-100 hover:bg-emerald-200 border border-emerald-300/60 rounded-md px-2.5 py-1 transition-colors">
                    <Plus className="size-3" />
                    Add
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inventory Panel for an Added Item ──────────────────────────────

function ThaliInventoryPanel({
  item,
  onSave,
  disabled,
}: {
  item: {
    available_quantity: number | null
    sold_quantity: number | null
    cutoff_time: string | null
  }
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
    <div className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/70 p-3 text-xs">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <p className="font-medium text-amber-900">Max Qty (blank = unlimited)</p>
          <Input
            type="number"
            min={0}
            disabled={disabled}
            className="h-8 w-24 text-xs bg-white"
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
              <div className="h-2 w-28 overflow-hidden rounded-full bg-amber-100">
                <div
                  className={`h-2 rounded-full transition-all ${
                    pct >= 80 ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span
                className={`font-semibold ${
                  pct >= 80 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {Math.round(pct)}%
              </span>
            </div>
          ) : (
            <p className="text-muted-foreground">Unlimited</p>
          )}
        </div>
        <div className="space-y-1">
          <p className="font-medium text-amber-900">Item Cutoff (blank = menu cutoff)</p>
          <Input
            type="time"
            disabled={disabled}
            className="h-8 w-28 text-xs bg-white"
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value)}
            onBlur={handleBlur}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function DailyThaliChoicesCard() {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const [date, setDate] = useState(todayStr)
  const [meal, setMeal] = useState<MealType>('lunch')

  const { data: menu, isPending: menuPending } = useDailyMenu(date, meal)
  const lockStatus = checkMenuEditLock(date, meal, menu?.cutoff_time)
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
  const removeFromGlobal = useRemoveThaliComponent()
  const updateInventory = useUpdateMenuItemInventory(menu?.id)

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [openSectionDropdown, setOpenSectionDropdown] = useState<ThaliComponentCategoryType | null>(null)

  // Map food_item_id → global component record for quick lookup
  const globalByFoodItemId = useMemo(() => {
    return new Map((globalComponents || []).map((c) => [c.food_item_id, c]))
  }, [globalComponents])

  // Map food_item_id → full FoodItemWithCategory from allFoodItems for canonical category info
  const foodItemsMap = useMemo(() => {
    return new Map((allFoodItems || []).map((fi) => [fi.id, fi]))
  }, [allFoodItems])

  // Filter daily items that are part of today's thali options (excluding whole thalis and farsan)
  const thaliOptionsList = useMemo(() => {
    return (menuItems || []).filter((item) => {
      const fullItem = foodItemsMap.get(item.food_item_id) || (item.food_items as FoodItemWithCategory)
      const section = mapItemToThaliSection(fullItem)
      // Exclude items that are mapped to null (like whole thalis or farsan)
      if (!section) return false
      return item.is_thali_option !== false
    })
  }, [menuItems, foodItemsMap])

  // Set of food_item_ids already active in today's menu
  const addedFoodItemIds = useMemo(() => {
    return new Set(thaliOptionsList.map((mi) => mi.food_item_id))
  }, [thaliOptionsList])

  // Group candidate food items by section, filtering out already-added and excluded items
  const availableBySection = useMemo(() => {
    const grouped: Record<ThaliComponentCategoryType, FoodItemWithCategory[]> = {
      sabji: [],
      bread: [],
      rice: [],
      sweet: [],
      accompaniment: [],
      beverage: [],
      snack: [],
    }

    for (const item of allFoodItems ?? []) {
      if (!item.is_available) continue
      if (addedFoodItemIds.has(item.id)) continue

      const section = mapItemToThaliSection(item)
      if (section && grouped[section]) {
        grouped[section].push(item)
      }
    }

    // Sort items alphabetically within each section
    for (const key of Object.keys(grouped) as ThaliComponentCategoryType[]) {
      grouped[key].sort((a, b) => a.name.localeCompare(b.name))
    }

    return grouped
  }, [allFoodItems, addedFoodItemIds])

  // Group currently added thali items by section for display
  const addedBySection = useMemo(() => {
    const grouped: Record<ThaliComponentCategoryType, typeof thaliOptionsList> = {
      sabji: [],
      bread: [],
      rice: [],
      sweet: [],
      accompaniment: [],
      beverage: [],
      snack: [],
    }

    for (const item of thaliOptionsList) {
      const fullItem = foodItemsMap.get(item.food_item_id) || (item.food_items as FoodItemWithCategory)
      const section = mapItemToThaliSection(fullItem)
      if (section && grouped[section]) {
        grouped[section].push(item)
      }
    }

    return grouped
  }, [thaliOptionsList, foodItemsMap])

  // Handler to toggle an item into Global Thali Components
  const handleGlobalSwitch = (
    foodItemId: string,
    sectionKey: ThaliComponentCategoryType,
    checked: boolean,
  ) => {
    const existing = globalByFoodItemId.get(foodItemId)
    if (checked) {
      if (!existing) {
        addToGlobal.mutate({ food_item_id: foodItemId, category_type: sectionKey })
      }
    } else {
      if (existing) {
        removeFromGlobal.mutate(existing.id)
      }
    }
  }

  // Handler to add an item to today's menu
  const handleAddItem = (foodItemId: string) => {
    if (!menu) return
    addItem.mutate({
      foodItemId,
      options: { is_thali_option: true, is_standalone_sale: false },
    })
  }

  // Total active thali items count today
  const totalActiveCount = thaliOptionsList.length

  return (
    <Card className="border-emerald-100 dark:border-emerald-950 shadow-sm">
      <CardHeader className="pb-4 border-b">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <SlidersHorizontal className="size-5 text-emerald-600" />
              Daily Items Manager
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Add and manage Thali items section-by-section (Sabji, Roti, Dal-Rice, Sweets, etc.).
              Toggle <strong className="text-blue-600 font-semibold">In Global</strong> to keep an item permanently available across all daily Thalis.
            </CardDescription>
          </div>

          {/* Controls: Date, Meal tabs, Auto-Populate */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1">
              <CalendarDays className="text-muted-foreground size-4" aria-hidden />
              <Input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-32 sm:w-36 h-8 text-xs border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <Tabs value={meal} onValueChange={(v) => setMeal(v as MealType)}>
              <TabsList className="h-9">
                {MEAL_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-xs px-2.5 py-1 min-h-[36px]"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Button
              disabled={lockStatus.isLocked || !menu || autoPopulate.isPending}
              variant="outline"
              size="sm"
              onClick={() => autoPopulate.mutate()}
              className="gap-1.5 text-xs h-9 min-h-[36px] bg-background hover:bg-emerald-50 hover:text-emerald-900 border-emerald-200"
            >
              <Sparkles className="size-3.5 text-amber-500" aria-hidden />
              Auto-Populate
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-5">
        {/* Cutoff / Lock status banners */}
        {lockStatus.isLocked && (
          <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-950 font-medium">
            <Lock className="size-4 text-amber-600 shrink-0" />
            <span>{lockStatus.reason}</span>
          </div>
        )}
        {!lockStatus.isLocked && lockStatus.isCustomerCutoffPassed && (
          <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-950 font-medium">
            <Clock className="size-4 text-amber-600 shrink-0" />
            <span>
              Customer ordering cutoff for this meal has passed ({lockStatus.cutoffDisplay ?? 'Closed'}). Admin management remains active.
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {menuPending || itemsPending ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sections Accordion / Cards */}
            {THALI_SECTION_ORDER.map((sectionKey) => {
              const label = COMPONENT_CATEGORY_LABELS[sectionKey]
              const activeItems = addedBySection[sectionKey] || []
              const availableItems = availableBySection[sectionKey] || []

              // Skip rendering snack section if no items exist at all in system
              if (sectionKey === 'snack' && activeItems.length === 0 && availableItems.length === 0) {
                return null
              }

              const isDropdownOpen = openSectionDropdown === sectionKey

              return (
                <div
                  key={sectionKey}
                  className={`rounded-xl border border-muted/80 bg-card shadow-xs transition-shadow hover:shadow-sm ${
                    isDropdownOpen ? 'relative z-30' : 'relative z-0'
                  }`}
                >
                  {/* Section Header with Section Title and Searchable Add Dropdown */}
                  <div className="bg-muted/30 px-4 py-3 border-b rounded-t-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        {label}
                      </h3>
                      <Badge
                        variant={activeItems.length > 0 ? 'default' : 'secondary'}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          activeItems.length > 0
                            ? 'bg-emerald-600 text-white hover:bg-emerald-600'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {activeItems.length} active
                      </Badge>
                    </div>

                    {/* Section Searchable Dropdown */}
                    <SectionSearchableDropdown
                      sectionKey={sectionKey}
                      items={availableItems}
                      disabled={lockStatus.isLocked || !menu}
                      onAdd={handleAddItem}
                      isAdding={addItem.isPending}
                      isOpen={isDropdownOpen}
                      onOpenChange={(open) =>
                        setOpenSectionDropdown(open ? sectionKey : null)
                      }
                    />
                  </div>

                  {/* Added Items List for this Section */}
                  <div className="p-3 sm:p-4">
                    {activeItems.length === 0 ? (
                      <div className="py-6 text-center rounded-lg border border-dashed border-muted bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                          No {label.replace(/^.+?\s/, '')} added for {meal} today.
                        </p>
                        <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                          Use the dropdown above to add available items into this section.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y rounded-lg border bg-background overflow-hidden">
                        {activeItems.map((item) => {
                          const isInGlobal = Boolean(globalByFoodItemId.get(item.food_item_id))

                          return (
                            <div key={item.id} className="p-3 flex flex-col">
                              {/* Main Item Row */}
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                {/* Item Details */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-sm text-foreground">
                                      {item.food_items.name}
                                    </p>
                                    {(() => {
                                      const fullItem = foodItemsMap.get(item.food_item_id) || (item.food_items as any)
                                      const categoryName = fullItem?.categories?.name || (item.food_items as any)?.categories?.name
                                      return categoryName ? (
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] font-normal px-1.5 py-0 h-4 bg-muted/40"
                                        >
                                          {categoryName}
                                        </Badge>
                                      ) : null
                                    })()}
                                    {item.available_quantity !== null &&
                                      (item.sold_quantity ?? 0) >= item.available_quantity && (
                                        <Badge variant="destructive" className="text-[10px] py-0 h-4">
                                          Sold Out
                                        </Badge>
                                      )}
                                    {item.cutoff_time && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] py-0 h-4 gap-1 text-amber-700 bg-amber-50"
                                      >
                                        <Clock className="size-2.5" />
                                        {item.cutoff_time.slice(0, 5)}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                    <span>
                                      Price: {CURRENCY_SYMBOL}
                                      {item.food_items.compare_price ?? item.food_items.price}
                                    </span>
                                    {item.available_quantity ? (
                                      <span className="text-amber-800 font-medium">
                                        {item.sold_quantity ?? 0}/{item.available_quantity} sold
                                      </span>
                                    ) : null}
                                  </div>
                                </div>

                                {/* Controls: Available, Special, In Global, Inventory, Remove */}
                                <div className="flex flex-wrap items-center gap-4 sm:gap-5 pt-1 sm:pt-0 border-t sm:border-t-0">
                                  {/* Available Switch */}
                                  <div className="flex items-center gap-1.5 min-h-[44px]">
                                    <span className="text-xs text-muted-foreground">Available</span>
                                    <Switch
                                      checked={item.is_available}
                                      disabled={lockStatus.isLocked}
                                      onCheckedChange={(checked) =>
                                        toggleAvailable.mutate({
                                          id: item.id,
                                          is_available: checked,
                                        })
                                      }
                                      aria-label={`Toggle availability for ${item.food_items.name}`}
                                    />
                                  </div>

                                  {/* Special Switch */}
                                  <div className="flex items-center gap-1.5 min-h-[44px]">
                                    <Sparkles className="size-3.5 text-amber-500" />
                                    <span className="text-xs text-amber-700 font-medium">Special</span>
                                    <Switch
                                      checked={item.is_special}
                                      disabled={lockStatus.isLocked}
                                      onCheckedChange={(checked) =>
                                        toggleSpecial.mutate({ id: item.id, is_special: checked })
                                      }
                                      aria-label={`Toggle special for ${item.food_items.name}`}
                                    />
                                  </div>

                                  {/* In Global Switch */}
                                  <div className="flex items-center gap-1.5 min-h-[44px]">
                                    <Globe className="size-3.5 text-blue-500" />
                                    <span className="text-xs text-blue-600 font-medium">In Global</span>
                                    <Switch
                                      checked={isInGlobal}
                                      disabled={
                                        lockStatus.isLocked ||
                                        addToGlobal.isPending ||
                                        removeFromGlobal.isPending
                                      }
                                      onCheckedChange={(checked) =>
                                        handleGlobalSwitch(
                                          item.food_item_id,
                                          sectionKey,
                                          checked,
                                        )
                                      }
                                      aria-label={`Toggle global availability for ${item.food_items.name}`}
                                    />
                                  </div>

                                  {/* Inventory Expansion Toggle */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="min-h-[44px] min-w-[44px] size-10 text-amber-700 hover:bg-amber-50 relative"
                                    title="Inventory controls"
                                    aria-label="Toggle inventory controls"
                                    onClick={() =>
                                      setExpandedItemId(
                                        expandedItemId === item.id ? null : item.id,
                                      )
                                    }
                                  >
                                    <Package className="size-4" aria-hidden />
                                    {expandedItemId === item.id ? (
                                      <ChevronUp className="size-3 absolute bottom-1 right-1" />
                                    ) : (
                                      <ChevronDown className="size-3 absolute bottom-1 right-1" />
                                    )}
                                  </Button>

                                  {/* Remove Item */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={lockStatus.isLocked}
                                    className="min-h-[44px] min-w-[44px] size-10 text-destructive hover:bg-destructive/10"
                                    aria-label={`Remove ${item.food_items.name} from today`}
                                    onClick={() => {
                                      const existingGlobal = globalByFoodItemId.get(
                                        item.food_item_id,
                                      )
                                      if (existingGlobal) {
                                        removeFromGlobal.mutate(existingGlobal.id)
                                      }
                                      if (item.is_standalone_sale) {
                                        toggleThaliOption.mutate({
                                          id: item.id,
                                          is_thali_option: false,
                                        })
                                      } else {
                                        removeItem.mutate(item.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="size-4" aria-hidden />
                                  </Button>
                                </div>
                              </div>

                              {/* Inventory Panel */}
                              {expandedItemId === item.id && (
                                <ThaliInventoryPanel
                                  item={item}
                                  disabled={lockStatus.isLocked}
                                  onSave={(data) =>
                                    updateInventory.mutate({ id: item.id, ...data })
                                  }
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {totalActiveCount === 0 && (
              <EmptyState
                icon={UtensilsCrossed}
                title="No Thali choices configured for this date & meal"
                description="Use the section search dropdowns above to add Sabjis, Breads, Dal-Bhat, and Sweets for today's Thali selections."
                className="border-dashed py-8"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

