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
  PackageCheck,
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
  { value: 'accepted', label: 'In Kitchen' },
  { value: 'ready', label: 'Ready / Packed' },
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
      else if (o.status === 'accepted' || o.status === 'preparing') {
        counts.accepted = (counts.accepted || 0) + 1
      } else if (o.status === 'ready' || o.status === 'out_for_delivery') {
        counts.ready = (counts.ready || 0) + 1
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
      result = result.filter((o) => o.status === 'accepted' || o.status === 'preparing')
    } else if (statusFilter === 'ready') {
      result = result.filter((o) => o.status === 'ready' || o.status === 'out_for_delivery')
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

  const { data: allFoodItems } = useFoodItems()

  // Map of canonical food_items from the database table (direct 1-to-1 link)
  const foodItemByName = useMemo(() => {
    const map = new Map<string, Tables<'food_items'>>()
    allFoodItems?.forEach((fi) => {
      map.set(fi.name.trim().toLowerCase(), fi)
    })
    return map
  }, [allFoodItems])

  // Kitchen Production Batch:
  // Directly linked to food items: only items present in order meal items are shown,
  // displaying with the exact same canonical name as per food_items table.
  const productionBatchItems = useMemo(() => {
    const itemsMap = new Map<string, {
      id: string
      name: string
      count: number
      unit: string
      subtitle: string
      categoryType: string
    }>()

    Object.values(filteredProduction.foodItems || {}).forEach((prodItem) => {
      if (prodItem.totalCount <= 0) return

      const canonical = foodItemByName.get(prodItem.name.trim().toLowerCase())
      const finalName = canonical?.name || prodItem.name
      const key = finalName.trim().toLowerCase()

      let subtitle = ''
      if (prodItem.categoryType === 'bread') {
        subtitle = `${prodItem.baseCount} base + ${prodItem.addonCount} extra`
      } else if (prodItem.addonCount > 0) {
        subtitle = `${prodItem.baseCount} base + ${prodItem.addonCount} extra`
      } else {
        const unitWord =
          prodItem.unit === 'bowls'
            ? prodItem.totalCount === 1 ? 'bowl' : 'bowls'
            : prodItem.unit === 'por.'
              ? prodItem.totalCount === 1 ? 'portion' : 'portions'
              : prodItem.totalCount === 1 ? 'item' : 'items'
        subtitle = `${prodItem.totalCount} ${unitWord} ordered`
      }

      itemsMap.set(key, {
        id: canonical?.id || key,
        name: finalName,
        count: prodItem.totalCount,
        unit: prodItem.unit,
        subtitle,
        categoryType: prodItem.categoryType,
      })
    })

    // Sort into logical kitchen production order:
    // 1: Breads -> 2: Sabjis -> 3: Dal & Rice -> 4: Farsan/Snacks -> 5: Accompaniments -> 6: Sweets -> 7: Others
    const categoryPriority = (catType: string, name: string): number => {
      const n = name.toLowerCase()
      if (catType === 'bread' || n.includes('rotli') || n.includes('roti') || n.includes('bhakh') || n.includes('thepla') || n.includes('puri') || n.includes('rotla')) return 1
      if (catType === 'sabji') return 2
      if (catType === 'rice_dal' || n.includes('dal') || n.includes('bhat') || n.includes('rice') || n.includes('kadhi')) return 3
      if (catType === 'farsan' || n.includes('chewdo') || n.includes('mamra') || n.includes('gathiya') || n.includes('farsan') || n.includes('snack')) return 4
      if (catType === 'accompaniment' || n.includes('salad') || n.includes('pickle') || n.includes('aachar') || n.includes('chutney')) return 5
      if (catType === 'sweet' || n.includes('sweet') || n.includes('mithai') || n.includes('prashad')) return 6
      return 7
    }

    return Array.from(itemsMap.values()).sort((a, b) => {
      const pA = categoryPriority(a.categoryType, a.name)
      const pB = categoryPriority(b.categoryType, b.name)
      if (pA !== pB) return pA - pB
      return a.name.localeCompare(b.name)
    })
  }, [filteredProduction, foodItemByName])

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

  // 1-Click Status Updates
  const handleDirectDeliver = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus.mutate({ id: orderId, status: 'delivered' })
  }

  const handleDirectReady = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    updateStatus.mutate({ id: orderId, status: 'ready' })
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

                  {/* Components snippet (e.g. 2× Bhakhari, Sev-tameta) */}
                  {item.components.length > 0 && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1">
                      {item.components
                        .map((c) => {
                          const canonical = foodItemByName.get(c.name.trim().toLowerCase())
                          const displayName = canonical?.name || c.name
                          return c.categoryType === 'bread' && c.quantity && c.quantity > 1
                            ? `${c.quantity}× ${displayName}`
                            : displayName
                        })
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
          const isAcceptedOrPreparing = o.status === 'accepted' || o.status === 'preparing'
          const isReadyOrOut = o.status === 'ready' || o.status === 'out_for_delivery'
          const isDelivered = o.status === 'delivered'
          const isCancelled = o.status === 'cancelled' || o.status === 'rejected'

          return (
            <div className="space-y-1.5">
              <OrderStatusBadge status={o.status} />

              {/* Direct Quick Actions: Pending -> Accept / Ready, Accepted -> Mark Ready, Ready -> Mark Delivered */}
              {!isDelivered && !isCancelled && (
                <div className="flex items-center gap-1 pt-0.5">
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 text-foreground font-medium hover:bg-accent"
                        onClick={(e) => handleAcceptOnly(o.id, e)}
                        disabled={updateStatus.isPending}
                        title="Accept order into kitchen"
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs font-semibold px-2 gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                        onClick={(e) => handleDirectReady(o.id, e)}
                        disabled={updateStatus.isPending}
                        title="Accept & mark ready/packed"
                      >
                        <PackageCheck className="size-3" />
                        <span>Ready</span>
                      </Button>
                    </>
                  )}

                  {isAcceptedOrPreparing && (
                    <Button
                      size="sm"
                      className="h-7 text-xs font-semibold px-2.5 gap-1 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
                      onClick={(e) => handleDirectReady(o.id, e)}
                      disabled={updateStatus.isPending}
                      title="Tick off order packaging: meals are packed in containers and ready for delivery"
                    >
                      <PackageCheck className="size-3" />
                      <span>Mark Ready</span>
                    </Button>
                  )}

                  {isReadyOrOut && (
                    <Button
                      size="sm"
                      className="h-7 text-xs font-semibold px-2.5 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                      onClick={(e) => handleDirectDeliver(o.id, e)}
                      disabled={updateStatus.isPending}
                      title="Mark order as Delivered"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>Mark Delivered</span>
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
                {filteredProduction.breads.rotli.total > 0 && filteredProduction.breads.bhakhri.total > 0
                  ? `${filteredProduction.breads.rotli.total} Rotlis + ${filteredProduction.breads.bhakhri.total} Bhakhari`
                  : filteredProduction.breads.rotli.total > 0
                    ? `${filteredProduction.breads.rotli.total} ${filteredProduction.breads.rotli.total === 1 ? 'Rotli' : 'Rotlis'}`
                    : filteredProduction.breads.bhakhri.total > 0
                      ? `${filteredProduction.breads.bhakhri.total} ${filteredProduction.breads.bhakhri.total === 1 ? 'Bhakhari' : 'Bhakharis'}`
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

          {/* Dynamic Kitchen Production Batch Cards for items present in orders */}
          {productionBatchItems.length === 0 ? (
            <div className="rounded-lg bg-background/60 p-4 border border-dashed border-amber-500/25 text-center text-xs text-muted-foreground">
              No meal components currently ordered in this production batch.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 text-center sm:text-left">
              {productionBatchItems.map((item) => (
                <div
                  key={item.id || item.name}
                  className="rounded-lg bg-background/80 p-2.5 border border-amber-500/15 space-y-0.5 hover:border-amber-500/40 transition-colors shadow-2xs"
                >
                  <p className="text-2xl font-black font-mono text-foreground tracking-tight">
                    {item.count}
                    <span className="text-xs font-normal text-muted-foreground ml-1">{item.unit}</span>
                  </p>
                  <p className="text-xs font-semibold text-foreground truncate" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate" title={item.subtitle}>
                    {item.subtitle}
                  </p>
                </div>
              ))}
            </div>
          )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <div className="flex items-center gap-1.5 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs font-semibold"
                        onClick={(e) => handleAcceptOnly(order.id, e)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1"
                        onClick={(e) => handleDirectReady(order.id, e)}
                      >
                        <PackageCheck className="size-3" />
                        Ready
                      </Button>
                    </div>
                  </div>
                ))}
              {filtered.filter((o) => o.status === 'pending').length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No pending orders</p>
              )}
            </div>
          </div>

          {/* Column 2: In Kitchen / Packaging */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs uppercase tracking-wide text-blue-600 flex items-center gap-1.5">
                <ChefHat className="size-3.5" /> Kitchen & Packing ({filtered.filter((o) => ['accepted', 'preparing'].includes(o.status)).length})
              </span>
            </div>
            <div className="space-y-2.5">
              {filtered
                .filter((o) => ['accepted', 'preparing'].includes(o.status))
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
                      className="w-full h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold mt-1 gap-1"
                      onClick={(e) => handleDirectReady(order.id, e)}
                    >
                      <PackageCheck className="size-3.5" />
                      Mark as Ready (Packed) ✓
                    </Button>
                  </div>
                ))}
              {filtered.filter((o) => ['accepted', 'preparing'].includes(o.status)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No orders in kitchen</p>
              )}
            </div>
          </div>

          {/* Column 3: Ready / Packed */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs uppercase tracking-wide text-emerald-600 flex items-center gap-1.5">
                <PackageCheck className="size-3.5" /> Ready for Delivery ({filtered.filter((o) => ['ready', 'out_for_delivery'].includes(o.status)).length})
              </span>
            </div>
            <div className="space-y-2.5">
              {filtered
                .filter((o) => ['ready', 'out_for_delivery'].includes(o.status))
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
                      className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold mt-1 gap-1"
                      onClick={(e) => handleDirectDeliver(order.id, e)}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Mark as Delivered ✓
                    </Button>
                  </div>
                ))}
              {filtered.filter((o) => ['ready', 'out_for_delivery'].includes(o.status)).length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6 italic">No ready orders</p>
              )}
            </div>
          </div>

          {/* Column 4: Delivered */}
          <div className="rounded-xl border bg-card p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-bold text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Delivered ({filtered.filter((o) => o.status === 'delivered').length})
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
