import { useEffect, useMemo, useState } from 'react'
import {
  ChefHat,
  Copy,
  Flame,
  Package,
  Printer,
  Soup,
  UtensilsCrossed,
  Wheat,
  AlertTriangle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { AdminOrder } from '@/features/orders/services/orders-service'
import {
  calculateKitchenProduction,
  formatKitchenProductionWhatsAppText,
} from '@/features/orders/utils/order-parser'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface KitchenPrepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orders: AdminOrder[]
  filteredOrders: AdminOrder[]
}

type BatchScope = 'to_cook_today' | 'all_today' | 'lunch_today' | 'dinner_today' | 'table_view'

export function KitchenPrepDialog({
  open,
  onOpenChange,
  orders,
  filteredOrders,
}: KitchenPrepDialogProps) {
  const [scope, setScope] = useState<BatchScope>('to_cook_today')
  const [activeTab, setActiveTab] = useState<'all' | 'breads' | 'sabjis' | 'dal_rice' | 'farsan' | 'packaging'>('all')

  const todayStr = dayjs().format('YYYY-MM-DD')

  // Today's total orders (excluding cancelled/rejected)
  const todayOrders = useMemo(() => {
    if (!orders) return []
    return orders.filter(
      (o) =>
        (!o.delivery_date || o.delivery_date.startsWith(todayStr)) &&
        o.status !== 'cancelled' &&
        o.status !== 'rejected',
    )
  }, [orders, todayStr])

  // Today's active orders waiting to be cooked (pending, accepted, preparing)
  const activeToCookOrders = useMemo(() => {
    return todayOrders.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status))
  }, [todayOrders])

  // Today's lunch orders
  const lunchTodayOrders = useMemo(() => {
    return todayOrders.filter(
      (o) => o.meal_type === 'lunch' || (o.delivery_slot_label || '').toLowerCase().includes('lunch'),
    )
  }, [todayOrders])

  // Today's dinner orders
  const dinnerTodayOrders = useMemo(() => {
    return todayOrders.filter(
      (o) => o.meal_type === 'dinner' || (o.delivery_slot_label || '').toLowerCase().includes('dinner'),
    )
  }, [todayOrders])

  // When dialog opens, default to 'to_cook_today' if there are pending/preparing orders;
  // If all today's orders are already delivered, default to 'all_today' so user can review the batch
  useEffect(() => {
    if (open) {
      if (activeToCookOrders.length > 0) {
        setScope('to_cook_today')
      } else {
        setScope('all_today')
      }
    }
  }, [open, activeToCookOrders.length])

  // Target orders based on active scope
  const targetOrders = useMemo(() => {
    if (scope === 'to_cook_today') return activeToCookOrders
    if (scope === 'all_today') return todayOrders
    if (scope === 'lunch_today') return lunchTodayOrders
    if (scope === 'dinner_today') return dinnerTodayOrders
    if (scope === 'table_view') return filteredOrders
    return todayOrders
  }, [scope, activeToCookOrders, todayOrders, lunchTodayOrders, dinnerTodayOrders, filteredOrders])

  const production = useMemo(() => {
    return calculateKitchenProduction(targetOrders)
  }, [targetOrders])

  const handleCopyWhatsApp = () => {
    const scopeLabel =
      scope === 'to_cook_today'
        ? "Today's Active Cooking Batch"
        : scope === 'all_today'
        ? "Today's Total Orders"
        : scope === 'lunch_today'
        ? "Today's Lunch"
        : scope === 'dinner_today'
        ? "Today's Dinner"
        : 'Table View Orders'
    const text = formatKitchenProductionWhatsAppText(production, `FoodIQ Kitchen Prep Sheet - ${scopeLabel}`)
    navigator.clipboard.writeText(text)
    toast.success('Kitchen Prep Sheet copied to clipboard! Ready to paste into WhatsApp.')
  }

  const handlePrint = () => {
    window.print()
  }

  const sabjiEntries = Object.values(production.sabjis)
  const dalEntries = Object.values(production.dalKadhiRice)
  const farsanEntries = Object.values(production.snacksFarsan)
  const sweetEntries = Object.values(production.sweets)
  const bevEntries = Object.values(production.beverages)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl p-0 gap-0">
        {/* Printable Section wrapper */}
        <div className="p-6 space-y-6">
          <DialogHeader className="space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-sm">
                  <ChefHat className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    Kitchen Prep &amp; Cook Sheet
                    <Badge variant="secondary" className="font-mono text-xs">
                      {scope === 'to_cook_today'
                        ? `To Cook Today (${production.totalOrders})`
                        : scope === 'all_today'
                        ? `All Today (${production.totalOrders})`
                        : scope === 'lunch_today'
                        ? `Lunch Today (${production.totalOrders})`
                        : scope === 'dinner_today'
                        ? `Dinner Today (${production.totalOrders})`
                        : `Table View (${production.totalOrders})`}
                    </Badge>
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Live production aggregator: calculate exact Rotli, Sabji, and Farsan counts to cook.
                  </DialogDescription>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyWhatsApp}
                  className="gap-1.5 text-xs h-8"
                  title="Copy formatted text to share on WhatsApp"
                >
                  <Copy className="size-3.5" />
                  Copy WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  title="Print Kitchen Sheet"
                >
                  <Printer className="size-3.5" />
                  Print Sheet
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Scope Selector */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 bg-muted/60 p-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setScope('to_cook_today')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scope === 'to_cook_today'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🔥 To Cook Today ({activeToCookOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('all_today')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scope === 'all_today'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                📦 All Today's Orders ({todayOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('lunch_today')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scope === 'lunch_today'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                ☀️ Lunch ({lunchTodayOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setScope('dinner_today')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  scope === 'dinner_today'
                    ? 'bg-background text-foreground shadow-xs font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                🌙 Dinner ({dinnerTodayOrders.length})
              </button>
              {filteredOrders && filteredOrders.length > 0 && filteredOrders.length < (orders?.length || 0) && (
                <button
                  type="button"
                  onClick={() => setScope('table_view')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                    scope === 'table_view'
                      ? 'bg-background text-foreground shadow-xs font-semibold text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🔍 Current Table View ({filteredOrders.length})
                </button>
              )}
            </div>

            {/* Scope explanation & guidance */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
              {scope === 'to_cook_today' ? (
                <span>
                  🔥 Showing live cook batch for <strong>{activeToCookOrders.length} orders waiting for preparation</strong> today (pending, accepted, preparing).
                </span>
              ) : scope === 'all_today' ? (
                <span>
                  📦 Showing combined summary of all <strong>{todayOrders.length} orders scheduled for today</strong> (including already delivered).
                </span>
              ) : scope === 'lunch_today' ? (
                <span>☀️ Showing batch for all {lunchTodayOrders.length} orders scheduled for Today's Lunch.</span>
              ) : scope === 'dinner_today' ? (
                <span>🌙 Showing batch for all {dinnerTodayOrders.length} orders scheduled for Today's Dinner.</span>
              ) : (
                <span>🔍 Showing calculations for the {filteredOrders.length} orders currently visible in your table view.</span>
              )}
            </div>
          </div>

          {/* Highlight Key Metrics (Hero Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Rotli Count */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Wheat className="size-3.5" /> Rotlis to Bake
                </span>
                <span className="text-[10px] bg-amber-500/10 px-1.5 py-0.5 rounded font-mono font-medium">Tawa</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {production.breads.rotli.total}
                <span className="text-xs font-normal text-muted-foreground ml-1">pcs</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {production.breads.rotli.base} Base + {production.breads.rotli.addOn} Extra Addons
              </p>
            </div>

            {/* 2. Total Meals */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-primary">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="size-3.5" /> Total Meals
                </span>
                <span className="text-[10px] bg-primary/10 px-1.5 py-0.5 rounded font-mono font-medium">Thalis</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {production.totalMeals}
                <span className="text-xs font-normal text-muted-foreground ml-1">thalis</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {[
                  production.totalRegularThalis > 0 ? `${production.totalRegularThalis} Reg` : null,
                  production.totalClassicThalis > 0 ? `${production.totalClassicThalis} Classic` : null,
                  production.totalPremiumThalis > 0 ? `${production.totalPremiumThalis} Prem` : null,
                  production.totalDeluxeThalis > 0 ? `${production.totalDeluxeThalis} Deluxe` : null,
                  production.totalOtherMeals > 0 ? `${production.totalOtherMeals} Other` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'No thalis ordered'}
              </p>
            </div>

            {/* 3. Sabjis / Curry portions */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Soup className="size-3.5" /> Sabji Portions
                </span>
                <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-medium">Curry</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {production.totalSabjiPortions}
                <span className="text-xs font-normal text-muted-foreground ml-1">bowls</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {sabjiEntries.length} distinct {sabjiEntries.length === 1 ? 'variety' : 'varieties'}
              </p>
            </div>

            {/* 4. Packaging Boxes */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
                <span className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="size-3.5" /> Packaging Units
                </span>
                <span className="text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded font-mono font-medium">Packing</span>
              </div>
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {production.packaging.totalPackages}
                <span className="text-xs font-normal text-muted-foreground ml-1">boxes</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {production.packaging.regular5CpTrays} 5-CP + {production.packaging.premium8CpTrays} 8-CP trays
              </p>
            </div>
          </div>

          {/* Station Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 h-auto p-1 gap-1">
              <TabsTrigger value="all" className="text-xs py-1.5">
                All Stations
              </TabsTrigger>
              <TabsTrigger value="breads" className="text-xs py-1.5 gap-1">
                🍞 Breads ({production.breads.totalAllBreads})
              </TabsTrigger>
              <TabsTrigger value="sabjis" className="text-xs py-1.5 gap-1">
                🍲 Sabjis ({production.totalSabjiPortions})
              </TabsTrigger>
              <TabsTrigger value="dal_rice" className="text-xs py-1.5 gap-1">
                🍚 Rice & Dal
              </TabsTrigger>
              <TabsTrigger value="farsan" className="text-xs py-1.5 gap-1">
                🥟 Farsan / Nasta
              </TabsTrigger>
              <TabsTrigger value="packaging" className="text-xs py-1.5 gap-1">
                📦 Packaging
              </TabsTrigger>
            </TabsList>

            {/* Station 1: Breads / Tawa Station */}
            {(activeTab === 'all' || activeTab === 'breads') && (
              <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍞</span>
                    <h3 className="font-semibold text-sm">Tawa & Breads Station (Bake Count)</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Total: {production.breads.totalAllBreads} pcs
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Rotli Card */}
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm flex items-center gap-1.5">
                        <Flame className="size-4 text-amber-500" /> Rotli
                      </span>
                      <span className="text-lg font-bold font-mono text-primary">
                        {production.breads.rotli.total} pcs
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2 rounded">
                      <div className="flex justify-between">
                        <span>Base from Thalis:</span>
                        <span className="font-mono font-medium">{production.breads.rotli.base} pcs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Add-ons / Standalone:</span>
                        <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          +{production.breads.rotli.addOn} pcs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bhakhri Card */}
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">Bhakhri</span>
                      <span className="text-lg font-bold font-mono">
                        {production.breads.bhakhri.total} pcs
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2 rounded">
                      <div className="flex justify-between">
                        <span>Base from Thalis:</span>
                        <span className="font-mono font-medium">{production.breads.bhakhri.base} pcs</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Add-ons / Standalone:</span>
                        <span className="font-mono font-medium">+{production.breads.bhakhri.addOn} pcs</span>
                      </div>
                    </div>
                  </div>

                  {/* Thepla / Puri / Rotla (if any) */}
                  {production.breads.thepla.total > 0 && (
                    <div className="rounded-lg border bg-background p-3 flex justify-between items-center">
                      <span className="font-semibold text-sm">Thepla</span>
                      <span className="font-bold font-mono text-base">{production.breads.thepla.total} pcs</span>
                    </div>
                  )}
                  {production.breads.puri.total > 0 && (
                    <div className="rounded-lg border bg-background p-3 flex justify-between items-center">
                      <span className="font-semibold text-sm">Puri</span>
                      <span className="font-bold font-mono text-base">{production.breads.puri.total} pcs</span>
                    </div>
                  )}
                  {production.breads.rotla.total > 0 && (
                    <div className="rounded-lg border bg-background p-3 flex justify-between items-center">
                      <span className="font-semibold text-sm">Bajri no Rotlo</span>
                      <span className="font-bold font-mono text-base">{production.breads.rotla.total} pcs</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Station 2: Sabjis & Shaak Station */}
            {(activeTab === 'all' || activeTab === 'sabjis') && (
              <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍲</span>
                    <h3 className="font-semibold text-sm">Curries & Shaak Station (Portions to Cook)</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Total: {production.totalSabjiPortions} portions
                  </Badge>
                </div>

                {sabjiEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 italic">
                    No specific sabji selections found in this batch.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {sabjiEntries.map((s) => (
                      <div
                        key={s.name}
                        className="rounded-lg border bg-background p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          {s.addonPortions > 0 && (
                            <p className="text-[11px] text-muted-foreground">
                              {s.basePortions} base + {s.addonPortions} extra
                            </p>
                          )}
                        </div>
                        <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {s.totalPortions}
                          <span className="text-xs font-normal text-muted-foreground ml-1">por.</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Station 3: Rice, Dal & Kadhi */}
            {(activeTab === 'all' || activeTab === 'dal_rice') && (
              <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍚</span>
                    <h3 className="font-semibold text-sm">Rice, Dal & Kadhi Station</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {Object.values(production.dalKadhiRice).reduce((acc, d) => acc + d.portions, 0)} portions
                  </Badge>
                </div>

                {dalEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 italic">
                    No Dal or Rice items ordered in this batch.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {dalEntries.map((d) => (
                      <div
                        key={d.name}
                        className="rounded-lg border bg-background p-3 flex items-center justify-between"
                      >
                        <span className="font-medium text-sm">{d.name}</span>
                        <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                          {d.portions} portions
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Station 4: Farsan, Nasta, Salads, Sweets & Drinks */}
            {(activeTab === 'all' || activeTab === 'farsan') && (
              <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🥟</span>
                    <h3 className="font-semibold text-sm">Farsan, Salads, Sweets & Chaas</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {farsanEntries.map((f) => (
                    <div
                      key={f.name}
                      className="rounded-lg border bg-background p-3 flex items-center justify-between"
                    >
                      <span className="font-medium text-sm">{f.name}</span>
                      <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                        {f.count}
                      </span>
                    </div>
                  ))}
                  {Object.values(production.salads.items).map((sal) => (
                    <div
                      key={sal.name}
                      className="rounded-lg border bg-background p-3 flex items-center justify-between"
                    >
                      <span className="font-medium text-sm">🥗 {sal.name}</span>
                      <span className="font-mono font-bold text-base text-lime-600 dark:text-lime-400">
                        {sal.count} portions
                      </span>
                    </div>
                  ))}
                  {sweetEntries.map((sw) => (
                    <div
                      key={sw.name}
                      className="rounded-lg border bg-background p-3 flex items-center justify-between"
                    >
                      <span className="font-medium text-sm">🍬 {sw.name}</span>
                      <span className="font-mono font-bold text-base text-pink-600 dark:text-pink-400">
                        {sw.count} pcs
                      </span>
                    </div>
                  ))}
                  {bevEntries.map((b) => (
                    <div
                      key={b.name}
                      className="rounded-lg border bg-background p-3 flex items-center justify-between"
                    >
                      <span className="font-medium text-sm">🥛 {b.name}</span>
                      <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                        {b.count}
                      </span>
                    </div>
                  ))}
                  {farsanEntries.length === 0 && Object.values(production.salads.items).length === 0 && sweetEntries.length === 0 && bevEntries.length === 0 && (
                    <p className="text-xs text-muted-foreground col-span-3 py-2 italic">
                      No standalone farsan, salads, or sweets ordered in this batch.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Station 5: Packaging */}
            {(activeTab === 'all' || activeTab === 'packaging') && (
              <div className="mt-4 rounded-xl border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <h3 className="font-semibold text-sm">Packaging Station (Boxes & Trays Required)</h3>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    Total: {production.packaging.totalPackages} units
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Standard 5-CP Meal Trays</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {production.packaging.regular5CpTrays}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {production.packaging.regular5CpTrays > 0 ? `${production.packaging.regular5CpTrays} units required` : 'None required'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Premium 8-CP Meal Trays</p>
                    <p className="text-2xl font-bold font-mono mt-1 text-primary">
                      {production.packaging.premium8CpTrays}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {production.packaging.premium8CpTrays > 0 ? `${production.packaging.premium8CpTrays} units required` : 'None required'}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Single Pack Containers</p>
                    <p className="text-2xl font-bold font-mono mt-1">
                      {production.packaging.singleContainers}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {production.packaging.singleContainers > 0 ? `${production.packaging.singleContainers} units required` : 'None required'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Tabs>

          {/* Customer Special Notes Alert (Important for kitchen!) */}
          {production.specialInstructionsList.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs uppercase tracking-wide">
                <AlertTriangle className="size-4" />
                Customer Special Cooking Instructions ({production.specialInstructionsList.length})
              </div>
              <div className="space-y-1.5 text-xs">
                {production.specialInstructionsList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-background/80 p-2 rounded border border-amber-500/20">
                    <span className="font-mono text-amber-700 dark:text-amber-400 font-bold shrink-0">
                      #{item.orderNumber}:
                    </span>
                    <span className="font-medium shrink-0">{item.customerName}</span>
                    <span className="text-muted-foreground italic">"{item.instruction}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
