import { useMemo, useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChefHat,
  Clock,
  Kanban,
  MapPin,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Table as TableIcon,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable } from '@/components/data-table/data-table'
import { OrderStatusBadge } from '@/components/common/order-status-badge'
import { OrderDetailDialog } from '@/features/orders/components/order-detail-dialog'
import { CreateOrderDialog } from '@/features/orders/components/create-order-dialog'
import { KitchenPrepDialog } from '@/features/orders/components/kitchen-prep-dialog'
import { OrderPrintDialog } from '@/features/orders/components/order-print-dialog'
import { useOrders, useUpdateOrderStatus } from '@/features/orders/hooks/use-orders'
import { useDeliveryZones } from '@/features/settings/hooks/use-delivery'
import { useFoodItems } from '@/features/food-items/hooks/use-food-items'
import { useThaliComponents } from '@/features/thalis/services/thali-components-service'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminOrder } from '@/features/orders/services/orders-service'
import {
  calculateKitchenProduction,
  parseOrderItemDetails,
} from '@/features/orders/utils/order-parser'
import { CURRENCY_SYMBOL } from '@/constants'
import type { OrderStatus, Tables } from '@/types/database.types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

type StatusTabValue = OrderStatus | 'all' | 'out_of_zone'
type DateFilterMode = 'today' | 'tomorrow' | 'yesterday' | 'custom' | 'all'

const STATUS_TABS: { value: StatusTabValue; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted / Kitchen' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'out_of_zone', label: '🟡 Out of Zone' },
  { value: 'cancelled', label: 'Cancelled / Rejected' },
]

export function OrdersPage() {
  const { data: orders, isPending, refetch } = useOrders()
  const { data: deliveryZones } = useDeliveryZones()
  const updateStatus = useUpdateOrderStatus()

  // Date Filter State (DEFAULT: 'today')
  const [dateMode, setDateMode] = useState<DateFilterMode>('today')
  const [customDate, setCustomDate] = useState<string>(dayjs().format('YYYY-MM-DD'))

  // Shift & Status filters
  const [statusFilter, setStatusFilter] = useState<StatusTabValue>('all')
  const [search, setSearch] = useState('')

  // Advanced filters
  const [zoneFilter, setZoneFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [variantFilter, setVariantFilter] = useState<string>('all')
  const [slotFilter, setSlotFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')

  // View Mode: 'table' vs 'board'
  const [viewMode, setViewMode] = useState<'table' | 'board'>('table')

  // Dialogs
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [createOrderOpen, setCreateOrderOpen] = useState(false)
  const [kitchenPrepOpen, setKitchenPrepOpen] = useState(false)
  const [quickPrintOrder, setQuickPrintOrder] = useState<AdminOrder | null>(null)

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) ?? null

  const todayStr = dayjs().format('YYYY-MM-DD')
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD')
  const yesterdayStr = dayjs().subtract(1, 'day').format('YYYY-MM-DD')

  // Helper to check if order matches active date mode
  const orderMatchesDate = (o: AdminOrder): boolean => {
    if (dateMode === 'all') return true
    const orderDate = o.delivery_date
      ? dayjs(o.delivery_date).format('YYYY-MM-DD')
      : dayjs(o.placed_at).format('YYYY-MM-DD')

    if (dateMode === 'today') return orderDate === todayStr
    if (dateMode === 'tomorrow') return orderDate === tomorrowStr
    if (dateMode === 'yesterday') return orderDate === yesterdayStr
    if (dateMode === 'custom') return orderDate === customDate
    return true
  }


  // Count per status tab (within active date mode)
  const statusCounts = useMemo(() => {
    if (!orders) return {} as Record<string, number>
    const counts: Record<string, number> = {
      all: 0,
      pending: 0,
      accepted: 0,
      delivered: 0,
      cancelled: 0,
      out_of_zone: 0,
    }

    orders.forEach((o) => {
      if (!orderMatchesDate(o)) return
      counts.all = (counts.all || 0) + 1

      if (o.is_out_of_zone) counts.out_of_zone = (counts.out_of_zone || 0) + 1

      if (o.status === 'pending') counts.pending = (counts.pending || 0) + 1
      else if (o.status === 'accepted' || o.status === 'preparing' || o.status === 'ready' || o.status === 'out_for_delivery') {
        counts.accepted = (counts.accepted || 0) + 1
      } else if (o.status === 'delivered') {
        counts.delivered = (counts.delivered || 0) + 1
      } else if (o.status === 'cancelled' || o.status === 'rejected') {
        counts.cancelled = (counts.cancelled || 0) + 1
      }
    })

    return counts
  }, [orders, dateMode, customDate])

  // Dynamic variants from orders
  const availableVariants = useMemo(() => {
    if (!orders) return []
    const variants = new Set<string>()
    orders.forEach((o) => {
      o.order_items?.forEach((i) => {
        const parsed = parseOrderItemDetails(i)
        if (parsed.variantName && parsed.variantName !== 'Standard') {
          variants.add(parsed.variantName)
        }
      })
    })
    return Array.from(variants)
  }, [orders])

  // Filtered orders list based on Date Mode, Status, Search, and Dropdowns
  const filtered = useMemo(() => {
    if (!orders) return []
    let result = orders

    // 1. Primary Date Filter (Default: Today!)
    result = result.filter(orderMatchesDate)

    // 2. Status Tab Filter
    if (statusFilter === 'out_of_zone') {
      result = result.filter((o) => o.is_out_of_zone)
    } else if (statusFilter === 'cancelled') {
      result = result.filter((o) => o.status === 'cancelled' || o.status === 'rejected')
    } else if (statusFilter === 'accepted') {
      result = result.filter((o) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
    } else if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter)
    }

    // 3. Zone filter
    if (zoneFilter === 'out_of_zone') {
      result = result.filter((o) => o.is_out_of_zone)
    } else if (zoneFilter === 'in_zone') {
      result = result.filter((o) => !o.is_out_of_zone)
    } else if (zoneFilter !== 'all') {
      result = result.filter((o) => o.zone_label?.toLowerCase() === zoneFilter.toLowerCase())
    }

    // 4. Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((o) =>
        o.order_items?.some((i) => {
          const parsed = parseOrderItemDetails(i)
          return parsed.categoryKind === categoryFilter
        }),
      )
    }

    // 5. Meal Variant filter
    if (variantFilter !== 'all') {
      result = result.filter((o) =>
        o.order_items?.some((i) => {
          const parsed = parseOrderItemDetails(i)
          return parsed.variantName.toLowerCase() === variantFilter.toLowerCase()
        }),
      )
    }

    // 6. Shift / Slot filter
    if (slotFilter === 'lunch') {
      result = result.filter((o) => o.meal_type === 'lunch' || (o.delivery_slot_label || '').toLowerCase().includes('lunch'))
    } else if (slotFilter === 'dinner') {
      result = result.filter((o) => o.meal_type === 'dinner' || (o.delivery_slot_label || '').toLowerCase().includes('dinner'))
    }

    // 7. Payment filter
    if (paymentFilter === 'paid') {
      result = result.filter((o) => o.payment_status === 'paid')
    } else if (paymentFilter === 'pending') {
      result = result.filter((o) => o.payment_status !== 'paid')
    }

    // 8. Search query
    const query = search.trim().toLowerCase()
    if (query) {
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(query) ||
          o.contact_name?.toLowerCase().includes(query) ||
          o.contact_phone?.includes(query) ||
          o.address_line1?.toLowerCase().includes(query) ||
          o.landmark?.toLowerCase().includes(query) ||
          o.zone_label?.toLowerCase().includes(query) ||
          o.order_items?.some((item) => item.item_name.toLowerCase().includes(query)),
      )
    }

    return result
  }, [
    orders,
    dateMode,
    customDate,
    statusFilter,
    zoneFilter,
    categoryFilter,
    variantFilter,
    slotFilter,
    paymentFilter,
    search,
  ])

  // Production Scope: 'active' (orders waiting to be cooked: pending, accepted, preparing) vs 'all' (all orders in view)
  const [productionScope, setProductionScope] = useState<'active' | 'all'>('active')

  const activeToCookCount = useMemo(() => {
    return filtered.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status)).length
  }, [filtered])

  const totalInViewCount = useMemo(() => {
    return filtered.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected').length
  }, [filtered])

  // Orders for production calculation:
  // When 'active', only orders that still need to be cooked (pending, accepted, preparing)
  // When 'all', all non-cancelled orders in current filtered table
  const productionOrders = useMemo(() => {
    if (productionScope === 'active') {
      return filtered.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status))
    }
    return filtered.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
  }, [filtered, productionScope])

  // Production calculation for current scope
  const filteredProduction = useMemo(() => {
    return calculateKitchenProduction(productionOrders)
  }, [productionOrders])

  // Active date for batch meals query
  const activeBatchDate =
    dateMode === 'today'
      ? todayStr
      : dateMode === 'tomorrow'
        ? tomorrowStr
        : dateMode === 'custom'
          ? customDate
          : todayStr

  // Query daily menu items for the batch date (to identify all items from meals available for sale)
  const { data: batchDailyMenuItems } = useQuery({
    queryKey: ['admin', 'batch-daily-menu-items', activeBatchDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_menu_items')
        .select('*, food_items(*, categories(*)), daily_menus!inner(menu_date, is_published, meal_type)')
        .eq('daily_menus.menu_date', activeBatchDate)
        .eq('is_available', true)
      if (error) {
        console.warn('Could not fetch daily menu items for batch:', error)
        return []
      }
      return data || []
    },
  })

  const { data: allFoodItems } = useFoodItems()
  const { data: thaliComponents } = useThaliComponents()

  // Map of canonical food_items from the database table (preserves exact casing and name)
  const foodItemByName = useMemo(() => {
    const map = new Map<string, Tables<'food_items'>>()
    allFoodItems?.forEach((fi) => {
      map.set(fi.name.trim().toLowerCase(), fi)
    })
    return map
  }, [allFoodItems])

  // All items from all meals available for sale + any items ordered in current batch
  const availableMealItems = useMemo(() => {
    const itemsMap = new Map<string, { id: string; name: string; kind: string; category?: string }>()

    // A. From daily_menu_items for active date
    batchDailyMenuItems?.forEach((dmi: any) => {
      const fi = dmi.food_items
      if (!fi) return
      // Exclude whole thali bundle packages (Regular Thali, Deluxe Thali, etc.)
      // We want the meal items themselves (Rotli, Sev-tameta, dudhi-dal, Dal-Bhat, Mamra no Chewdo, etc.)
      if (fi.kind !== 'thali' && !fi.name.toLowerCase().includes('thali')) {
        const canonical = foodItemByName.get(fi.name.trim().toLowerCase()) || fi
        itemsMap.set(canonical.name.trim().toLowerCase(), {
          id: canonical.id,
          name: canonical.name, // EXACT name from food_items table!
          kind: canonical.kind,
          category: (canonical as any).categories?.category_type || '',
        })
      }
    })

    // B. If no daily menu items found for this date, fall back to global thali_components
    if (itemsMap.size === 0 && thaliComponents && thaliComponents.length > 0) {
      thaliComponents.forEach((tc) => {
        const fi = tc.food_items
        if (fi && fi.kind !== 'thali' && !fi.name.toLowerCase().includes('thali')) {
          const canonical = foodItemByName.get(fi.name.trim().toLowerCase()) || fi
          itemsMap.set(canonical.name.trim().toLowerCase(), {
            id: canonical.id,
            name: canonical.name, // EXACT name from food_items table!
            kind: canonical.kind,
            category: tc.category_type || '',
          })
        }
      })
    }

    // C. Always include all ordered items from active production orders
    // 1. Sabjis in orders
    Object.values(filteredProduction.sabjis).forEach((s) => {
      const canonical = foodItemByName.get(s.name.trim().toLowerCase())
      const finalName = canonical?.name || s.name
      itemsMap.set(finalName.trim().toLowerCase(), {
        id: canonical?.id || finalName,
        name: finalName,
        kind: 'single',
        category: 'sabji',
      })
    })

    // 2. Dal / Rice in orders
    Object.values(filteredProduction.dalKadhiRice).forEach((d) => {
      const canonical = foodItemByName.get(d.name.trim().toLowerCase()) || foodItemByName.get('dal-bhat')
      const finalName = canonical?.name || d.name
      itemsMap.set(finalName.trim().toLowerCase(), {
        id: canonical?.id || finalName,
        name: finalName,
        kind: 'single',
        category: 'rice',
      })
    })

    // 3. Salads in orders
    Object.values(filteredProduction.salads.items).forEach((sal) => {
      const canonical = foodItemByName.get(sal.name.trim().toLowerCase()) || foodItemByName.get('fresh green salad')
      const finalName = canonical?.name || sal.name
      itemsMap.set(finalName.trim().toLowerCase(), {
        id: canonical?.id || finalName,
        name: finalName,
        kind: 'single',
        category: 'accompaniment',
      })
    })

    // 4. Snacks / Farsan in orders
    Object.values(filteredProduction.snacksFarsan).forEach((snk) => {
      const canonical = foodItemByName.get(snk.name.trim().toLowerCase())
      const finalName = canonical?.name || snk.name
      itemsMap.set(finalName.trim().toLowerCase(), {
        id: canonical?.id || finalName,
        name: finalName,
        kind: 'single',
        category: 'snack',
      })
    })

    // 5. Sweets in orders
    Object.values(filteredProduction.sweets).forEach((swt) => {
      const canonical = foodItemByName.get(swt.name.trim().toLowerCase())
      const finalName = canonical?.name || swt.name
      itemsMap.set(finalName.trim().toLowerCase(), {
        id: canonical?.id || finalName,
        name: finalName,
        kind: 'single',
        category: 'sweet',
      })
    })

    // 6. Ensure Rotli is included if available in food items
    if (!itemsMap.has('rotli')) {
      const rotliFi = foodItemByName.get('rotli')
      if (rotliFi) {
        itemsMap.set('rotli', {
          id: rotliFi.id,
          name: rotliFi.name,
          kind: 'single',
          category: 'bread',
        })
      }
    }

    // 7. If Bhakhri ordered, ensure it is included
    if (filteredProduction.breads.bhakhri.total > 0 && !itemsMap.has('bhakhri') && !itemsMap.has('gujarati bhakhri')) {
      const bhakhriFi = foodItemByName.get('bhakhri') || foodItemByName.get('gujarati bhakhri')
      itemsMap.set('bhakhri', {
        id: bhakhriFi?.id || 'bhakhri',
        name: bhakhriFi?.name || 'Bhakhri',
        kind: 'single',
        category: 'bread',
      })
    }

    // Fallback: If still empty, use available single items from food_items table
    if (itemsMap.size === 0 && allFoodItems && allFoodItems.length > 0) {
      allFoodItems
        .filter((fi) => fi.kind === 'single' && fi.is_available)
        .forEach((fi) => {
          itemsMap.set(fi.name.trim().toLowerCase(), {
            id: fi.id,
            name: fi.name,
            kind: fi.kind,
            category: (fi as any).categories?.category_type || '',
          })
        })
    }

    // Sort into logical kitchen production order:
    // 1: Breads -> 2: Sabjis -> 3: Dal & Rice -> 4: Salads -> 5: Snacks/Farsan -> 6: Sweets -> 7: Others
    const categoryPriority = (item: { name: string; category?: string }): number => {
      const n = item.name.toLowerCase()
      if (n.includes('rotli') || n.includes('roti') || n.includes('bhakhri') || n.includes('thepla') || n.includes('puri') || n.includes('rotla')) return 1
      if (n.includes('sev') || n.includes('tameta') || n.includes('dudhi') || n.includes('bhinda') || n.includes('bataka') || n.includes('shaak') || n.includes('sabji') || item.category === 'sabji') return 2
      if (n.includes('dal') || n.includes('bhat') || n.includes('rice') || n.includes('kadhi') || item.category === 'rice') return 3
      if (n.includes('salad') || n.includes('sambharo') || n.includes('aachar') || n.includes('pickle') || item.category === 'accompaniment') return 4
      if (n.includes('chewdo') || n.includes('mamra') || n.includes('gathiya') || n.includes('farsan') || n.includes('snack') || item.category === 'snack') return 5
      if (n.includes('gud') || n.includes('jaggery') || n.includes('sweet') || n.includes('mithai') || item.category === 'sweet') return 6
      return 7
    }

    return Array.from(itemsMap.values()).sort((a, b) => {
      const pA = categoryPriority(a)
      const pB = categoryPriority(b)
      if (pA !== pB) return pA - pB
      return a.name.localeCompare(b.name)
    })
  }, [batchDailyMenuItems, thaliComponents, foodItemByName, filteredProduction, allFoodItems])

  // Helper to compute live count, unit, and subtitle for each item
  const getItemProductionStats = (item: { name: string; category?: string }) => {
    const n = item.name.toLowerCase()

    // 1. Rotli
    if (n.includes('rotli') || n.includes('roti') || n.includes('phulka')) {
      const total = filteredProduction.breads.rotli.total
      return {
        count: total,
        unit: 'pcs',
        subtitle:
          total > 0
            ? `${filteredProduction.breads.rotli.base} base + ${filteredProduction.breads.rotli.addOn} extra`
            : 'None ordered',
      }
    }

    // 2. Bhakhri
    if (n.includes('bhakhri')) {
      const total = filteredProduction.breads.bhakhri.total
      return {
        count: total,
        unit: 'pcs',
        subtitle:
          total > 0
            ? `${filteredProduction.breads.bhakhri.base} base + ${filteredProduction.breads.bhakhri.addOn} extra`
            : 'None ordered',
      }
    }

    // 3. Other breads
    if (n.includes('thepla')) {
      const total = filteredProduction.breads.thepla.total
      return { count: total, unit: 'pcs', subtitle: total > 0 ? `${total} pcs ordered` : 'None ordered' }
    }
    if (n.includes('puri')) {
      const total = filteredProduction.breads.puri.total
      return { count: total, unit: 'pcs', subtitle: total > 0 ? `${total} pcs ordered` : 'None ordered' }
    }
    if (n.includes('rotla')) {
      const total = filteredProduction.breads.rotla.total
      return { count: total, unit: 'pcs', subtitle: total > 0 ? `${total} pcs ordered` : 'None ordered' }
    }

    // 4. Sabjis (Sev-tameta, dudhi-dal, Bhinda Masala, bataka, etc.)
    const sabjiEntry =
      filteredProduction.sabjis[n] ||
      Object.values(filteredProduction.sabjis).find(
        (s) => s.name.toLowerCase() === n || n.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(n),
      )

    if (sabjiEntry) {
      return {
        count: sabjiEntry.totalPortions,
        unit: 'por.',
        subtitle:
          sabjiEntry.addonPortions > 0
            ? `${sabjiEntry.basePortions} base + ${sabjiEntry.addonPortions} extra`
            : sabjiEntry.totalPortions > 0
              ? `${sabjiEntry.totalPortions} ${sabjiEntry.totalPortions === 1 ? 'portion' : 'portions'} ordered`
              : 'None ordered',
      }
    }
    if (
      item.category === 'sabji' ||
      n.includes('sev') ||
      n.includes('tameta') ||
      n.includes('dudhi') ||
      n.includes('bhinda') ||
      n.includes('bataka')
    ) {
      return { count: 0, unit: 'por.', subtitle: 'None ordered' }
    }

    // 5. Dal & Rice (Dal-Bhat)
    if (n.includes('dal') || n.includes('bhat') || n.includes('rice') || n.includes('kadhi')) {
      const dalEntry =
        filteredProduction.dalKadhiRice[n] ||
        Object.values(filteredProduction.dalKadhiRice).find(
          (d) => d.name.toLowerCase() === n || n.includes(d.name.toLowerCase()),
        )

      const count =
        dalEntry?.portions ??
        (n.includes('dal') || n.includes('bhat')
          ? Math.max(
            Object.values(filteredProduction.dalKadhiRice).reduce((acc, d) => acc + d.portions, 0),
            filteredProduction.mealsWithDalRice,
          )
          : 0)

      return {
        count,
        unit: 'bowls',
        subtitle: count > 0 ? `${count} ${count === 1 ? 'bowl' : 'bowls'} ordered` : 'None ordered',
      }
    }

    // 6. Salads / Accompaniments (Fresh Green Salad, etc.)
    if (n.includes('salad') || n.includes('sambharo')) {
      const salEntry =
        filteredProduction.salads.items[n] ||
        Object.values(filteredProduction.salads.items).find(
          (s) => s.name.toLowerCase() === n || n.includes(s.name.toLowerCase()),
        )

      const count = salEntry?.count ?? filteredProduction.salads.totalPortions
      return {
        count,
        unit: 'por.',
        subtitle: count > 0 ? `${count} ${count === 1 ? 'portion' : 'portions'} ordered` : 'None ordered',
      }
    }

    // 7. Snacks / Farsan (Mamra no Chewdo, etc.)
    if (
      n.includes('chewdo') ||
      n.includes('mamra') ||
      n.includes('gathiya') ||
      n.includes('farsan') ||
      n.includes('snack') ||
      item.category === 'snack'
    ) {
      const snkEntry =
        filteredProduction.snacksFarsan[n] ||
        Object.values(filteredProduction.snacksFarsan).find(
          (s) => s.name.toLowerCase() === n || n.includes(s.name.toLowerCase()),
        )
      const salCount = filteredProduction.salads.items[n]?.count || 0
      const count = (snkEntry?.count || 0) + salCount
      return {
        count,
        unit: 'pcs',
        subtitle: count > 0 ? `${count} ${count === 1 ? 'item' : 'items'} ordered` : 'None ordered',
      }
    }

    // 8. Sweets (Gud (Jaggery), etc.)
    if (
      n.includes('gud') ||
      n.includes('jaggery') ||
      n.includes('sweet') ||
      n.includes('mithai') ||
      item.category === 'sweet'
    ) {
      const swtEntry =
        filteredProduction.sweets[n] ||
        Object.values(filteredProduction.sweets).find(
          (s) => s.name.toLowerCase() === n || n.includes(s.name.toLowerCase()),
        )
      const salCount = filteredProduction.salads.items[n]?.count || 0
      const count = (swtEntry?.count || 0) + salCount
      return {
        count,
        unit: 'pcs',
        subtitle: count > 0 ? `${count} ${count === 1 ? 'portion' : 'portions'} ordered` : 'None ordered',
      }
    }

    return {
      count: 0,
      unit: 'por.',
      subtitle: 'None ordered',
    }
  }

  const hasActiveFilters =
    zoneFilter !== 'all' ||
    categoryFilter !== 'all' ||
    variantFilter !== 'all' ||
    slotFilter !== 'all' ||
    paymentFilter !== 'all' ||
    dateMode !== 'today' ||
    search.trim() !== ''

  const clearAllFilters = () => {
    setDateMode('today')
    setZoneFilter('all')
    setCategoryFilter('all')
    setVariantFilter('all')
    setSlotFilter('all')
    setPaymentFilter('all')
    setSearch('')
  }

  // 1-Click Status Update: Direct delivery!
  const handleDirectDeliver = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus.mutate({ id: orderId, status: 'delivered' })
  }

  const handleAcceptOnly = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus.mutate({ id: orderId, status: 'accepted' })
  }

  // Table Columns Definition
  const columns = useMemo<ColumnDef<AdminOrder>[]>(
    () => [
      {
        accessorKey: 'order_number',
        header: 'Order & Time',
        cell: ({ row }) => {
          const o = row.original
          const placedDay = dayjs(o.placed_at)
          return (
            <div className="space-y-1">
              <span className="font-mono font-bold text-sm text-foreground hover:text-primary transition-colors">
                {o.order_number}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                <span>{placedDay.format('h:mm A')}</span>
                <span>({placedDay.fromNow(true)})</span>
              </div>
              {o.meal_type && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  {o.meal_type === 'dinner' ? '🌙 Dinner' : '☀️ Lunch'}
                  {o.preferred_lunch_time ? ` · ${o.preferred_lunch_time}` : ''}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'contact_name',
        header: 'Customer & Zone',
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">{o.contact_name}</p>
              <p className="text-muted-foreground text-xs font-mono">{o.contact_phone || 'No phone'}</p>
              <div className="flex flex-wrap items-center gap-1 pt-0.5">
                {o.is_out_of_zone ? (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[10px] px-1.5 py-0.2">
                    🟡 Out of Zone
                  </Badge>
                ) : o.zone_label ? (
                  <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5 px-1.5 py-0.2">
                    <MapPin className="size-2.5 mr-0.5" />
                    {o.zone_label}
                  </Badge>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        id: 'items',
        header: 'Items & Meal Components',
        cell: ({ row }) => {
          const rawItems = row.original.order_items ?? (row.original as any).items ?? []
          if (!rawItems.length) return <span className="text-muted-foreground text-xs">No items</span>

          const parsedList = rawItems.map((i: any) => parseOrderItemDetails(i))

          return (
            <div className="space-y-2 max-w-sm">
              {parsedList.map((item, idx) => (
                <div key={item.id ?? idx} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">{item.itemName}</span>
                    <span className="font-bold text-primary bg-primary/10 px-1 rounded text-[11px]">
                      × {item.quantity}
                    </span>
                    {item.variantName && item.variantName !== 'Standard' && (
                      <span className="text-[10px] font-semibold bg-muted px-1.5 py-0.2 rounded text-muted-foreground">
                        {item.variantName}
                      </span>
                    )}
                  </div>

                  {/* Components snippet (e.g. 5× Rotli, Sev-tameta) */}
                  {item.components.length > 0 && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {item.components
                        .map((c) =>
                          c.categoryType === 'bread' && c.quantity && c.quantity > 1
                            ? `${c.quantity}× ${c.name}`
                            : c.name,
                        )
                        .join(', ')}
                    </p>
                  )}

                  {/* Add-ons preview */}
                  {item.addons.length > 0 && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      + {item.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status & Quick Action',
        cell: ({ row }) => {
          const o = row.original
          const isPending = o.status === 'pending'
          const isDelivered = o.status === 'delivered'
          const isCancelled = o.status === 'cancelled' || o.status === 'rejected'

          return (
            <div className="space-y-1.5">
              <OrderStatusBadge status={o.status} />

              {/* Direct 1-Click Deliver or Accept */}
              {!isDelivered && !isCancelled && (
                <div className="flex items-center gap-1 pt-0.5">
                  <Button
                    size="sm"
                    className="h-7 text-xs font-semibold px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                    onClick={(e) => handleDirectDeliver(o.id, e)}
                    disabled={updateStatus.isPending}
                    title="Mark order directly as Delivered"
                  >
                    <CheckCircle2 className="size-3" />
                    <span>{isPending ? 'Accept & Deliver' : 'Mark Delivered'}</span>
                  </Button>

                  {isPending && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                      onClick={(e) => handleAcceptOnly(o.id, e)}
                      disabled={updateStatus.isPending}
                      title="Accept order without marking delivered immediately"
                    >
                      Accept
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'total_amount',
        header: 'Total & Payment',
        cell: ({ row }) => {
          const o = row.original
          return (
            <div className="space-y-1">
              <span className="font-bold text-sm font-mono block">
                {CURRENCY_SYMBOL}
                {o.total_amount}
              </span>
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${o.payment_status === 'paid'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                  }`}
              >
                {o.payment_method || 'CASH'} · {o.payment_status || 'Pending'}
              </span>
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              title="Print Order Slip"
              onClick={(e) => {
                e.stopPropagation()
                setQuickPrintOrder(row.original)
              }}
            >
              <Printer className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        ),
      },
    ],
    [updateStatus],
  )

  return (
    <div className="space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Orders Management</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kitchen Cook Count Launcher Button */}
          <Button
            onClick={() => setKitchenPrepOpen(true)}
            variant="default"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs"
          >
            <ChefHat className="size-4" />
            Kitchen Prep Sheet
            {filteredProduction.breads.totalAllBreads > 0 && (
              <span className="bg-black/20 text-white text-xs px-2 py-0.5 rounded-full font-mono">
                {filteredProduction.breads.rotli.total > 0
                  ? `${filteredProduction.breads.rotli.total} Rotlis${filteredProduction.breads.bhakhri.total > 0
                    ? ` + ${filteredProduction.breads.bhakhri.total} Bhakhri`
                    : ''
                  }`
                  : `${filteredProduction.breads.totalAllBreads} Breads`}
              </span>
            )}
          </Button>

          {/* Create Order Button */}
          <Button onClick={() => setCreateOrderOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* STREAMLINED OPERATIONAL HERO AREA: FULL-WIDTH KITCHEN PRODUCTION BATCH */}
      <div className="w-full">
        {/* EXPANDED KITCHEN PRODUCTION BATCH (Full Width) */}
        <div
          onClick={() => setKitchenPrepOpen(true)}
          className="w-full rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 cursor-pointer hover:border-amber-500/50 transition-all space-y-3.5 shadow-xs"
        >
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/15 pb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                <ChefHat className="size-4 text-amber-600" />
                Kitchen Production Batch
              </span>

              {/* Scope Segmented Pill: To Cook Now vs All in View */}
              <div
                className="flex items-center gap-0.5 bg-amber-500/15 p-0.5 rounded-md text-[11px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setProductionScope('active')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${productionScope === 'active'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-50'
                    }`}
                  title="Only orders currently pending, accepted, or preparing (waiting to be cooked)"
                >
                  🔥 To Cook ({activeToCookCount})
                </button>
                <button
                  type="button"
                  onClick={() => setProductionScope('all')}
                  className={`px-2 py-0.5 rounded font-semibold transition-all ${productionScope === 'all'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-900/80 dark:text-amber-200/80 hover:text-amber-950 dark:hover:text-amber-50'
                    }`}
                  title="All orders in current view including completed & delivered"
                >
                  📦 All in View ({totalInViewCount})
                </button>
              </div>

              <Badge variant="outline" className="text-[11px] font-semibold bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30">
                {filteredProduction.totalMeals} {filteredProduction.totalMeals === 1 ? 'Meal' : 'Meals'}
                {[
                  filteredProduction.totalRegularThalis > 0 ? `${filteredProduction.totalRegularThalis} Reg` : null,
                  filteredProduction.totalClassicThalis > 0 ? `${filteredProduction.totalClassicThalis} Classic` : null,
                  filteredProduction.totalPremiumThalis > 0 ? `${filteredProduction.totalPremiumThalis} Prem` : null,
                  filteredProduction.totalDeluxeThalis > 0 ? `${filteredProduction.totalDeluxeThalis} Deluxe` : null,
                  filteredProduction.totalOtherMeals > 0 ? `${filteredProduction.totalOtherMeals} Other` : null,
                ].filter(Boolean).length > 0 &&
                  ` (${[
                    filteredProduction.totalRegularThalis > 0 ? `${filteredProduction.totalRegularThalis} Reg` : null,
                    filteredProduction.totalClassicThalis > 0 ? `${filteredProduction.totalClassicThalis} Classic` : null,
                    filteredProduction.totalPremiumThalis > 0 ? `${filteredProduction.totalPremiumThalis} Prem` : null,
                    filteredProduction.totalDeluxeThalis > 0 ? `${filteredProduction.totalDeluxeThalis} Deluxe` : null,
                    filteredProduction.totalOtherMeals > 0 ? `${filteredProduction.totalOtherMeals} Other` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')})`}
              </Badge>
            </div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1">
              Open Full Cook Sheet →
            </span>
          </div>

          {/* Dynamic Kitchen Production Batch Cards for ALL available meal items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 text-center sm:text-left">
            {availableMealItems.map((item) => {
              const stats = getItemProductionStats(item)
              return (
                <div
                  key={item.id || item.name}
                  className="rounded-lg bg-background/80 p-2.5 border border-amber-500/15 space-y-0.5 hover:border-amber-500/40 transition-colors shadow-2xs"
                >
                  <p className="text-2xl font-black font-mono text-foreground tracking-tight">
                    {stats.count}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{stats.unit}</span>
                  </p>
                  <p className="text-xs font-semibold text-foreground truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate" title={stats.subtitle}>
                    {stats.subtitle}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* DATE MODE BANNER WHEN TODAY HAS 0 ORDERS BUT OLDER ORDERS EXIST */}
      {dateMode === 'today' && filtered.length === 0 && (orders?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <Calendar className="size-4 shrink-0 text-blue-600" />
            <span>
              Showing <strong>Today's Orders ({dayjs().format('D MMM YYYY')})</strong>: 0 orders found today. There are <strong>{orders?.length} orders</strong> on other dates.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDateMode('all')}
            className="h-7 text-xs border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 font-semibold"
          >
            Show All Dates ({orders?.length}) →
          </Button>
        </div>
      )}

      {/* STATUS TABS BAR WITH DYNAMIC COUNTS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusTabValue)}>
          <TabsList className="flex-wrap h-auto p-1 gap-1">
            {STATUS_TABS.map((tab) => {
              const count = statusCounts[tab.value] ?? 0
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="text-xs py-1.5 px-3 gap-1.5">
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-muted font-bold">
                    {count}
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>

        {/* View Switcher: Table vs Board */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            className="h-7 text-xs gap-1 px-2.5"
            onClick={() => setViewMode('table')}
          >
            <TableIcon className="size-3.5" />
            Table View
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            className="h-7 text-xs gap-1 px-2.5"
            onClick={() => setViewMode('board')}
          >
            <Kanban className="size-3.5" />
            Kitchen Board
          </Button>
        </div>
      </div>

      {/* MULTI-DIMENSIONAL FILTER CONTROLS */}
      <div className="rounded-xl border bg-card p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, name, phone, dish…"
              className="pl-9 h-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Date Picker Filter */}
          <div className="flex items-center gap-1.5">
            <div className="w-[160px]">
              <Select value={dateMode} onValueChange={(v) => setDateMode(v as DateFilterMode)}>
                <SelectTrigger className="h-9 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="size-3.5 text-primary shrink-0" />
                    <SelectValue placeholder="Date" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">📅 Today ({dayjs().format('D MMM')})</SelectItem>
                  <SelectItem value="tomorrow">📅 Tomorrow ({dayjs().add(1, 'day').format('D MMM')})</SelectItem>
                  <SelectItem value="custom">📆 Custom Date</SelectItem>
                  <SelectItem value="all">🌐 All Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateMode === 'custom' && (
              <Input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="h-9 w-[130px] text-xs font-mono"
              />
            )}
          </div>

          {/* Shift / Slot Filter */}
          <div className="w-[150px]">
            <Select value={slotFilter} onValueChange={setSlotFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🕒 All Shifts</SelectItem>
                <SelectItem value="lunch">☀️ Lunch Shift</SelectItem>
                <SelectItem value="dinner">🌙 Dinner Shift</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Zone Filter Dropdown */}
          <div className="w-[170px]">
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📍 All Delivery Zones</SelectItem>
                <SelectItem value="out_of_zone">🟡 Out of Zone Only</SelectItem>
                <SelectItem value="in_zone">🟢 Standard In-Zone</SelectItem>
                {deliveryZones?.map((z) => (
                  <SelectItem key={z.id} value={z.name}>
                    {z.name} ({z.zone_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category / Dish Kind Filter */}
          <div className="w-[160px]">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🍱 All Categories</SelectItem>
                <SelectItem value="meal">🍱 Meals & Thalis</SelectItem>
                <SelectItem value="farsan">🥟 Nasta & Farsan</SelectItem>
                <SelectItem value="sweet">🍬 Sweets & Mithai</SelectItem>
                <SelectItem value="beverage">🥛 Beverages / Chaas</SelectItem>
                <SelectItem value="alacarte">🍛 A La Carte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meal Variant Filter (Regular, Premium, Classic, etc.) */}
          <div className="w-[160px]">
            <Select value={variantFilter} onValueChange={setVariantFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Meal Variants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">✨ All Meal Variants</SelectItem>
                <SelectItem value="Regular">Regular Thali</SelectItem>
                <SelectItem value="Premium">Premium Thali</SelectItem>
                <SelectItem value="Classic">Classic Thali</SelectItem>
                {availableVariants
                  .filter((v) => !['Regular', 'Premium', 'Classic'].includes(v))
                  .map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Status Filter */}
          <div className="w-[140px]">
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">💳 All Payments</SelectItem>
                <SelectItem value="paid">Paid (UPI)</SelectItem>
                <SelectItem value="pending">Pending (Cash)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={clearAllFilters}
              className="h-9 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="size-3.5" />
              Reset
            </Button>
          )}

          {/* Refresh Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => refetch()}
            className="size-9 ml-auto"
            title="Refresh Orders"
          >
            <RefreshCw className="size-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* VIEW: TABLE VIEW */}
      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={isPending}
          emptyTitle="No orders found"
          emptyDescription={
            dateMode === 'today'
              ? 'No orders found for Today. Use the date selector above to view other dates.'
              : hasActiveFilters
                ? 'No orders matched your selected filters. Try clearing filters.'
                : 'Orders will appear here as customers place them.'
          }
          onRowClick={(order) => setSelectedOrderId(order.id)}
        />
      ) : (
        /* VIEW: LIVE KITCHEN BOARD (SIMPLIFIED COLUMNS) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Pending */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs uppercase tracking-wide text-amber-600 flex items-center gap-1.5">
                <Bell className="size-3.5" /> Pending ({filtered.filter((o) => o.status === 'pending').length})
              </span>
            </div>
            <div className="space-y-2.5">
              {filtered
                .filter((o) => o.status === 'pending')
                .map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="rounded-lg border bg-background p-3 space-y-2 cursor-pointer hover:border-primary/50 shadow-2xs transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs">{order.order_number}</span>
                      <span className="text-[11px] font-mono font-bold text-primary">
                        {CURRENCY_SYMBOL}{order.total_amount}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{order.contact_name}</p>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      {order.order_items?.map((i) => (
                        <div key={i.id}>
                          • {i.item_name} × {i.quantity}
                        </div>
                      ))}
                    </div>
                    {order.is_out_of_zone && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded font-bold block">
                        🟡 Out of Zone
                      </span>
                    )}
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-1"
                      onClick={(e) => handleDirectDeliver(order.id, e)}
                    >
                      Accept & Deliver ✓
                    </Button>
                  </div>
                ))}
              {filtered.filter((o) => o.status === 'pending').length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No pending orders</p>
              )}
            </div>
          </div>

          {/* Column 2: In Kitchen / In Progress */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs uppercase tracking-wide text-primary flex items-center gap-1.5">
                <ChefHat className="size-3.5" /> In-Progress ({filtered.filter((o) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length})
              </span>
            </div>
            <div className="space-y-2.5">
              {filtered
                .filter((o) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status))
                .map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="rounded-lg border bg-background p-3 space-y-2 cursor-pointer hover:border-primary/50 shadow-2xs transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs">{order.order_number}</span>
                      <span className="text-[11px] font-mono font-bold text-primary">
                        {CURRENCY_SYMBOL}{order.total_amount}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{order.contact_name}</p>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      {order.order_items?.map((i) => (
                        <div key={i.id}>
                          • {i.item_name} × {i.quantity}
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-1"
                      onClick={(e) => handleDirectDeliver(order.id, e)}
                    >
                      Mark as Delivered ✓
                    </Button>
                  </div>
                ))}
              {filtered.filter((o) => ['accepted', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No orders in progress</p>
              )}
            </div>
          </div>

          {/* Column 3: Delivered */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs uppercase tracking-wide text-emerald-600 flex items-center gap-1.5">
                Delivered ({filtered.filter((o) => o.status === 'delivered').length})
              </span>
            </div>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {filtered
                .filter((o) => o.status === 'delivered')
                .map((order) => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="rounded-lg border bg-background p-3 space-y-1.5 cursor-pointer hover:border-primary/50 shadow-2xs transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-bold text-xs">{order.order_number}</span>
                      <span className="text-[11px] font-mono font-bold text-emerald-600">
                        {CURRENCY_SYMBOL}{order.total_amount}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{order.contact_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Completed {dayjs(order.placed_at).format('h:mm A')}
                    </p>
                  </div>
                ))}
              {filtered.filter((o) => o.status === 'delivered').length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No delivered orders</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Order Details Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrderId(null)}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderOpen}
        onOpenChange={setCreateOrderOpen}
      />

      {/* Kitchen Prep & Cook Count Aggregator Dialog */}
      <KitchenPrepDialog
        open={kitchenPrepOpen}
        onOpenChange={setKitchenPrepOpen}
        orders={orders || []}
        filteredOrders={filtered}
      />

      {/* Quick Print Dialog */}
      <OrderPrintDialog
        open={Boolean(quickPrintOrder)}
        onOpenChange={(open) => !open && setQuickPrintOrder(null)}
        order={quickPrintOrder}
      />
    </div>
  )
}
