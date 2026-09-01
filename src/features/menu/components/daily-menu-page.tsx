import { useState } from 'react'
import dayjs from 'dayjs'
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Lock,
  Package,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  useCopyPreviousMenu,
  useDailyMenu,
  useMenuItems,
  useRemoveMenuItem,
  useToggleMenuItemAvailable,
  useToggleMenuItemStandalone,
  useTogglePublish,
  useUpdateMenuCutoff,
  useUpdateMenuItemInventory,
} from '@/features/menu/hooks/use-daily-menu'
import { checkMenuEditLock } from '@/features/menu/utils/menu-cutoff'
import { CURRENCY_SYMBOL } from '@/constants'
import type { DailyMenuItemWithFood } from '@/features/menu/services/daily-menu-service'
import type { MealType } from '@/types/database.types'

const MEAL_TABS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
]

/** Inventory sub-panel — shown when a row is expanded */
function InventoryPanel({
  item,
  onSave,
  disabled,
}: {
  item: DailyMenuItemWithFood
  onSave: (data: { available_quantity: number | null; cutoff_time: string | null }) => void
  disabled?: boolean
}) {
  const [qty, setQty] = useState(item.available_quantity?.toString() ?? '')
  const [cutoff, setCutoff] = useState(item.cutoff_time?.slice(0, 5) ?? '')

  const soldQty = item.sold_quantity ?? 0
  const maxQty = item.available_quantity ?? null
  const pct = maxQty && maxQty > 0 ? Math.min((soldQty / maxQty) * 100, 100) : 0
  const isSoldOut = maxQty !== null && soldQty >= maxQty

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
        {/* Max Qty */}
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

        {/* Sold progress */}
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
              {isSoldOut && (
                <Badge variant="destructive" className="py-0 text-[10px]">Sold Out</Badge>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground">No cap set</p>
          )}
        </div>

        {/* Item-level cutoff */}
        <div className="space-y-1">
          <p className="font-medium text-amber-900">Item Cutoff (blank = use menu cutoff)</p>
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

export function DailyMenuPage() {
  const todayStr = dayjs().format('YYYY-MM-DD')
  const [date, setDate] = useState(todayStr)
  const [meal, setMeal] = useState<MealType>('lunch')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  // Copy previous menu state
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [sourceDate, setSourceDate] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'))

  const { data: menu, isPending: menuPending } = useDailyMenu(date, meal)
  const lockStatus = checkMenuEditLock(date, meal, menu?.cutoff_time)
  const { data: menuItems, isPending: itemsPending } = useMenuItems(menu?.id)
  const { data: allFoodItems } = useFoodItems()

  const togglePublish = useTogglePublish(date, meal)
  const updateCutoff = useUpdateMenuCutoff(date, meal)
  const addItem = useAddMenuItem(menu?.id)
  const copyMenu = useCopyPreviousMenu(menu?.id)
  const removeItem = useRemoveMenuItem(menu?.id)
  const toggleAvailable = useToggleMenuItemAvailable(menu?.id)
  const toggleStandalone = useToggleMenuItemStandalone(menu?.id)
  const updateInventory = useUpdateMenuItemInventory(menu?.id)

  const storefrontMenuItems = (menuItems || []).filter(
    (item) => item.is_standalone_sale === true,
  )

  const availableToAdd = (allFoodItems ?? []).filter(
    (item) => item.is_available && !storefrontMenuItems.some((mi) => mi.food_item_id === item.id),
  )

  const handleCopy = () => {
    if (sourceDate && menu?.id) {
      copyMenu.mutate(
        { sourceDate, meal },
        { onSuccess: () => setCopyDialogOpen(false) },
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Daily Offerings</h1>
          <p className="text-muted-foreground text-sm">
            Manage what customers can order today across all meals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2"
          onClick={() => setCopyDialogOpen(true)}
          disabled={lockStatus.isLocked || !menu}
        >
          <Copy className="size-4" aria-hidden />
          Copy Previous Menu
        </Button>
      </div>

      {lockStatus.isLocked && (
        <div className="flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-950 font-medium shadow-sm">
          <Lock className="size-4 text-amber-600 shrink-0" />
          <span>{lockStatus.reason}</span>
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-muted-foreground size-4" aria-hidden />
              <Input
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Tabs value={meal} onValueChange={(v) => setMeal(v as MealType)}>
              <TabsList>
                {MEAL_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {menu ? (
            <div className="flex flex-wrap items-center gap-6">
              {/* Menu-level cutoff (fallback for items without their own) */}
              <div className="flex items-center gap-2 rounded-lg bg-amber-50/80 px-3 py-1.5 border border-amber-200/80">
                <Clock className="text-amber-700 size-4" aria-hidden />
                <span className="text-xs font-semibold text-amber-950 uppercase tracking-wider">Menu Cutoff:</span>
                <Input
                  type="time"
                  disabled={lockStatus.isLocked}
                  className="w-24 h-7 text-xs font-semibold bg-white border-amber-300"
                  value={menu.cutoff_time?.slice(0, 5) ?? (meal === 'lunch' ? '10:30' : meal === 'dinner' ? '17:30' : '08:00')}
                  onChange={(e) =>
                    updateCutoff.mutate({ id: menu.id, cutoff_time: e.target.value || null })
                  }
                />
              </div>

              {/* Single publish control */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {menu.is_published ? 'Published' : 'Draft'}
                </span>
                <Switch
                  checked={menu.is_published}
                  disabled={lockStatus.isLocked || togglePublish.isPending}
                  onCheckedChange={(checked) =>
                    togglePublish.mutate({ id: menu.id, is_published: checked })
                  }
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className={`flex flex-col gap-3 sm:flex-row ${lockStatus.isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <Select disabled={lockStatus.isLocked} value={selectedItemId} onValueChange={setSelectedItemId}>
              <SelectTrigger className="w-full sm:max-w-sm">
                <SelectValue placeholder="Select an item for direct selling…" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.length === 0 ? (
                  <div className="text-muted-foreground px-3 py-2 text-sm">
                    No more available items to add
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
                  addItem.mutate({
                    foodItemId: selectedItemId,
                    options: { is_standalone_sale: true, is_thali_option: true },
                  }, { onSuccess: () => setSelectedItemId('') })
                }
              }}
            >
              <Plus className="size-4" aria-hidden />
              Add to Storefront
            </Button>
          </div>

          {menuPending || itemsPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !storefrontMenuItems?.length ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No items on today's storefront menu"
              description="Add dishes above so customers can order them directly on the main website shop."
              className="border-none py-12"
            />
          ) : (
            <ul className="divide-border divide-y">
              {storefrontMenuItems.map((item) => {
                const soldOut = item.available_quantity !== null &&
                  (item.sold_quantity ?? 0) >= item.available_quantity
                const isExpanded = expandedItemId === item.id

                return (
                  <li key={item.id} className="flex flex-col py-3">
                    {/* Main row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.food_items.name}</p>
                          {(item.food_items as any).categories?.name ? (
                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                              {(item.food_items as any).categories.name}
                            </Badge>
                          ) : null}
                          {soldOut && (
                            <Badge variant="destructive" className="text-[10px] py-0">Sold Out</Badge>
                          )}
                          {item.cutoff_time ? (
                            <Badge variant="secondary" className="text-[10px] py-0 gap-1">
                              <Clock className="size-2.5" />
                              {item.cutoff_time.slice(0, 5)}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {CURRENCY_SYMBOL}
                          {item.price_override ?? item.food_items.offer_price ?? item.food_items.price}
                          {item.available_quantity ? (
                            <span className="ml-2 text-xs text-amber-700">
                              {item.sold_quantity ?? 0}/{item.available_quantity} sold
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
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

                        {/* Inventory expand toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                          title="Inventory controls"
                          onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        >
                          <Package className="size-4" aria-hidden />
                          {isExpanded ? (
                            <ChevronUp className="size-3 absolute bottom-0.5 right-0.5" />
                          ) : (
                            <ChevronDown className="size-3 absolute bottom-0.5 right-0.5" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={lockStatus.isLocked}
                          aria-label="Remove from menu"
                          onClick={() => {
                            if (item.is_thali_option) {
                              toggleStandalone.mutate({ id: item.id, is_standalone_sale: false })
                            } else {
                              removeItem.mutate(item.id)
                            }
                          }}
                        >
                          <Trash2 className="text-destructive size-4" aria-hidden />
                        </Button>
                      </div>
                    </div>

                    {/* Inventory panel */}
                    {isExpanded && (
                      <InventoryPanel
                        item={item}
                        disabled={lockStatus.isLocked}
                        onSave={(data) => updateInventory.mutate({ id: item.id, ...data })}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Copy Previous Menu Dialog */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Copy Menu from Previous Date</DialogTitle>
            <DialogDescription>
              Select a past date to copy all dishes into {date} ({meal}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Source Date</label>
              <Input
                type="date"
                value={sourceDate}
                onChange={(e) => setSourceDate(e.target.value)}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              This will import all items from the source menu ({meal}) into today's menu without creating duplicates.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={copyMenu.isPending}>
              {copyMenu.isPending ? 'Copying…' : 'Copy Menu Items'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
