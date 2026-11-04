import { useState, useMemo, useEffect } from 'react'
import {
  Calculator,
  Clock,
  HelpCircle,
  MapPin,
  MoreHorizontal,
  Navigation,
  Plus,
  RotateCcw,
  Save,
  Search,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import {
  useCreateDeliveryArea,
  useDeleteDeliveryArea,
  useDeliveryAreas,
  useUpdateDeliveryArea,
} from '@/features/settings/hooks/use-delivery'
import { useConfigValue, useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'
import { CURRENCY_SYMBOL, DEFAULT_KITCHEN_LOCATION } from '@/constants'
import type { DeliverySettings } from '@/types/delivery'
import type { Tables } from '@/types/database.types'

type Area = Tables<'delivery_areas'>

const EMPTY_AREA_FORM = {
  name: '',
  area_key: '',
  pincode: '',
  city: 'Ahmedabad',
  state: 'Gujarat',
}

const EMPTY_DELIVERY_SETTINGS: DeliverySettings = {
  zone_a_pincodes: [],
  zone_b_pincodes: [],
  zone_b_enabled: true,
  free_delivery_radius_km: 0,
  base_delivery_fee: 0,
  per_km_fee: 0,
  max_delivery_distance_km: 0,
  party_order_phone: '',
}

export function DeliveryAreasTab() {
  const [activeTab, setActiveTab] = useState<'pincodes' | 'pricing' | 'areas'>('pincodes')

  // Queries
  const { data: areas, isPending: areasPending } = useDeliveryAreas()
  const { data: configData } = useSystemConfig()
  const rawDeliveryConfig = useConfigValue<DeliverySettings>('delivery_settings')

  // Mutations
  const createArea = useCreateDeliveryArea()
  const updateArea = useUpdateDeliveryArea()
  const deleteArea = useDeleteDeliveryArea()
  const updateConfig = useUpdateSystemConfig()

  // Delivery Settings State: Loaded 100% dynamically from database
  const deliverySettings: DeliverySettings = useMemo(() => {
    if (!rawDeliveryConfig) return EMPTY_DELIVERY_SETTINGS
    return {
      zone_a_pincodes: Array.isArray(rawDeliveryConfig.zone_a_pincodes)
        ? rawDeliveryConfig.zone_a_pincodes
        : [],
      zone_b_pincodes: Array.isArray(rawDeliveryConfig.zone_b_pincodes)
        ? rawDeliveryConfig.zone_b_pincodes
        : [],
      zone_b_enabled: rawDeliveryConfig.zone_b_enabled ?? true,
      free_delivery_radius_km: Number(rawDeliveryConfig.free_delivery_radius_km ?? 0),
      base_delivery_fee: Number(rawDeliveryConfig.base_delivery_fee ?? 0),
      per_km_fee: Number(rawDeliveryConfig.per_km_fee ?? 0),
      max_delivery_distance_km: Number(rawDeliveryConfig.max_delivery_distance_km ?? 0),
      party_order_phone: rawDeliveryConfig.party_order_phone || '',
    }
  }, [rawDeliveryConfig])

  const [deliveryForm, setDeliveryForm] = useState<DeliverySettings>(EMPTY_DELIVERY_SETTINGS)

  useEffect(() => {
    if (deliverySettings) {
      setDeliveryForm(deliverySettings)
    }
  }, [deliverySettings])

  // Pincode Input States
  const [newPincodeA, setNewPincodeA] = useState('')
  const [newPincodeB, setNewPincodeB] = useState('')

  // Pricing Simulator State
  const [testDistance, setTestDistance] = useState<number>(4.5)

  // Kitchen location state
  const kitchenLoc = useMemo(() => {
    const item = configData?.find((c) => c.key === 'kitchen_location')
    if (!item?.value) return { ...DEFAULT_KITCHEN_LOCATION }
    const val = item.value as any
    const lat = Number(val.lat)
    const lng = Number(val.lng)
    // If coordinates are invalid or point to legacy Gota location (> 23.08), default to Bodakdev
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat > 23.08 && lat < 23.15)) {
      return { ...DEFAULT_KITCHEN_LOCATION }
    }
    return { lat, lng }
  }, [configData])

  const [kitchenLat, setKitchenLat] = useState<string>('')
  const [kitchenLng, setKitchenLng] = useState<string>('')
  const [isEditingKitchen, setIsEditingKitchen] = useState(false)

  // Dialog State - Areas
  const [areaSearch, setAreaSearch] = useState('')
  const [areaFormOpen, setAreaFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deletingArea, setDeletingArea] = useState<Area | null>(null)
  const [areaForm, setAreaForm] = useState(EMPTY_AREA_FORM)

  // Filtered areas
  const filteredAreas = useMemo(() => {
    if (!areas) return []
    if (!areaSearch.trim()) return areas
    const q = areaSearch.toLowerCase().trim()
    return areas.filter(
      (a) => a.name.toLowerCase().includes(q) || a.area_key?.toLowerCase().includes(q) || a.pincode?.includes(q),
    )
  }, [areas, areaSearch])

  // Save Kitchen Location
  const handleSaveKitchenLocation = () => {
    const lat = parseFloat(kitchenLat || String(kitchenLoc.lat))
    const lng = parseFloat(kitchenLng || String(kitchenLoc.lng))
    if (isNaN(lat) || isNaN(lng)) return
    updateConfig.mutate(
      {
        key: 'kitchen_location',
        value: { lat, lng } as any,
      },
      { onSuccess: () => setIsEditingKitchen(false) },
    )
  }

  // Instant Toggle Zone B master switch
  const handleToggleZoneB = (checked: boolean) => {
    const updated: DeliverySettings = {
      ...deliveryForm,
      zone_b_enabled: checked,
    }
    setDeliveryForm(updated)
    updateConfig.mutate(
      { key: 'delivery_settings', value: updated as any },
      {
        onSuccess: () => {
          toast.success(checked ? 'Zone B deliveries opened' : 'Zone B paused due to peak rush')
        },
      },
    )
  }

  // Add Pincode to Zone A
  const handleAddPincodeA = () => {
    const pin = newPincodeA.trim()
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Pincode must be exactly 6 digits')
      return
    }
    if (deliveryForm.zone_a_pincodes.includes(pin)) {
      toast.error(`Pincode ${pin} is already in Zone A`)
      return
    }

    const updated = {
      ...deliveryForm,
      zone_a_pincodes: [...deliveryForm.zone_a_pincodes, pin],
      // Remove from Zone B if present there
      zone_b_pincodes: deliveryForm.zone_b_pincodes.filter((p) => p !== pin),
    }
    setDeliveryForm(updated)
    setNewPincodeA('')
    updateConfig.mutate(
      { key: 'delivery_settings', value: updated as any },
      { onSuccess: () => toast.success(`Added ${pin} to Zone A`) },
    )
  }

  // Remove Pincode from Zone A
  const handleRemovePincodeA = (pin: string) => {
    const updated = {
      ...deliveryForm,
      zone_a_pincodes: deliveryForm.zone_a_pincodes.filter((p) => p !== pin),
    }
    setDeliveryForm(updated)
    updateConfig.mutate(
      { key: 'delivery_settings', value: updated as any },
      { onSuccess: () => toast.success(`Removed ${pin} from Zone A`) },
    )
  }

  // Add Pincode to Zone B
  const handleAddPincodeB = () => {
    const pin = newPincodeB.trim()
    if (!/^\d{6}$/.test(pin)) {
      toast.error('Pincode must be exactly 6 digits')
      return
    }
    if (deliveryForm.zone_b_pincodes.includes(pin)) {
      toast.error(`Pincode ${pin} is already in Zone B`)
      return
    }

    const updated = {
      ...deliveryForm,
      zone_b_pincodes: [...deliveryForm.zone_b_pincodes, pin],
      // Remove from Zone A if present there
      zone_a_pincodes: deliveryForm.zone_a_pincodes.filter((p) => p !== pin),
    }
    setDeliveryForm(updated)
    setNewPincodeB('')
    updateConfig.mutate(
      { key: 'delivery_settings', value: updated as any },
      { onSuccess: () => toast.success(`Added ${pin} to Zone B`) },
    )
  }

  // Remove Pincode from Zone B
  const handleRemovePincodeB = (pin: string) => {
    const updated = {
      ...deliveryForm,
      zone_b_pincodes: deliveryForm.zone_b_pincodes.filter((p) => p !== pin),
    }
    setDeliveryForm(updated)
    updateConfig.mutate(
      { key: 'delivery_settings', value: updated as any },
      { onSuccess: () => toast.success(`Removed ${pin} from Zone B`) },
    )
  }

  // Save Pricing Settings
  const handleSavePricing = () => {
    updateConfig.mutate(
      { key: 'delivery_settings', value: deliveryForm as any },
      { onSuccess: () => toast.success('Delivery pricing rules saved!') },
    )
  }

  // Reset Form
  const handleResetDefaults = () => {
    setDeliveryForm(EMPTY_DELIVERY_SETTINGS)
    updateConfig.mutate(
      { key: 'delivery_settings', value: EMPTY_DELIVERY_SETTINGS as any },
      { onSuccess: () => toast.success('Cleared delivery settings') },
    )
  }

  // --- Area Handlers ---
  const openCreateArea = () => {
    setEditingArea(null)
    setAreaForm(EMPTY_AREA_FORM)
    setAreaFormOpen(true)
  }
  const openEditArea = (a: Area) => {
    setEditingArea(a)
    setAreaForm({
      name: a.name,
      area_key: a.area_key ?? '',
      pincode: a.pincode ?? '',
      city: a.city ?? 'Ahmedabad',
      state: a.state ?? 'Gujarat',
    })
    setAreaFormOpen(true)
  }
  const handleSaveArea = () => {
    const name = areaForm.name.trim()
    const area_key = areaForm.area_key.trim().toLowerCase() || name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const payload = {
      name,
      area_key,
      pincode: areaForm.pincode.trim() || null,
      city: areaForm.city.trim() || 'Ahmedabad',
      state: areaForm.state.trim() || 'Gujarat',
    }
    if (editingArea) {
      updateArea.mutate({ id: editingArea.id, input: payload }, { onSuccess: () => setAreaFormOpen(false) })
    } else {
      createArea.mutate(payload, { onSuccess: () => setAreaFormOpen(false) })
    }
  }

  // Calculation Simulator (Unified distance pricing for both Zone A & Zone B)
  const simulatedFee = useMemo(() => {
    if (testDistance <= deliveryForm.free_delivery_radius_km) return 0
    const extraKm = Math.round((testDistance - deliveryForm.free_delivery_radius_km) * 10) / 10
    return Math.round(deliveryForm.base_delivery_fee + extraKm * deliveryForm.per_km_fee)
  }, [testDistance, deliveryForm])

  return (
    <div className="space-y-6">
      {/* ── TOP KPI / OVERVIEW CARDS ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="bg-muted/40 flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Zone A (Core)</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {deliveryForm.zone_a_pincodes.length} <span className="text-xs font-normal text-muted-foreground">Pincodes</span>
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-bold">
            {deliveryForm.free_delivery_radius_km > 0
              ? `0-${deliveryForm.free_delivery_radius_km} km FREE`
              : 'Configurable'}
          </Badge>
        </div>

        <div className="bg-muted/40 flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Zone B (Extended)</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {deliveryForm.zone_b_pincodes.length} <span className="text-xs font-normal text-muted-foreground">Pincodes</span>
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              deliveryForm.zone_b_enabled
                ? 'border-emerald-500/30 text-emerald-700 bg-emerald-500/10 font-bold'
                : 'border-destructive/30 text-destructive bg-destructive/10 font-bold'
            }
          >
            {deliveryForm.zone_b_enabled ? 'Active' : 'Paused'}
          </Badge>
        </div>

        <div className="bg-muted/40 flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Pricing Rates</p>
            <p className="text-lg font-bold text-foreground">
              {deliveryForm.base_delivery_fee > 0 || deliveryForm.per_km_fee > 0
                ? `${CURRENCY_SYMBOL}${deliveryForm.base_delivery_fee} + ${CURRENCY_SYMBOL}${deliveryForm.per_km_fee}/km`
                : 'Not set'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {deliveryForm.max_delivery_distance_km > 0
                ? `Max: ${deliveryForm.max_delivery_distance_km} km`
                : 'No cutoff set'}
            </p>
          </div>
          <Calculator className="size-6 text-primary/70 shrink-0" />
        </div>

        <div className="bg-muted/40 flex items-center justify-between rounded-xl border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Kitchen Origin GPS</p>
            <p className="font-mono text-xs font-bold text-foreground mt-1">
              {kitchenLoc.lat.toFixed(4)}, {kitchenLoc.lng.toFixed(4)}
            </p>
            <p className="text-[11px] text-muted-foreground">Ahmedabad central</p>
          </div>
          <Navigation className="size-6 text-primary/70 shrink-0" />
        </div>
      </div>

      {/* ── ZONE B RUSH MASTER SWITCH ── */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
              <Clock className="size-4 text-amber-600 shrink-0" />
              Zone B (Extended Area) Rush Hour Switch
            </span>
            <Badge
              variant="outline"
              className={
                deliveryForm.zone_b_enabled
                  ? 'border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 font-bold text-xs'
                  : 'border-destructive/40 text-destructive bg-destructive/10 font-bold text-xs'
              }
            >
              {deliveryForm.zone_b_enabled ? 'ACCEPTING ZONE B ORDERS' : 'PAUSED (PEAK RUSH)'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            During heavy lunch/dinner rushes when rider capacity is stretched, toggle this switch OFF to temporarily pause incoming orders from Zone B. Customers in Zone B will be notified that delivery is temporarily paused due to kitchen rush.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <Label htmlFor="zone-b-switch" className="text-xs font-bold cursor-pointer">
            {deliveryForm.zone_b_enabled ? 'Turn OFF (Rush Hour)' : 'Turn ON (Accept Orders)'}
          </Label>
          <Switch
            id="zone-b-switch"
            checked={deliveryForm.zone_b_enabled}
            onCheckedChange={handleToggleZoneB}
            disabled={updateConfig.isPending}
          />
        </div>
      </div>

      {/* ── KITCHEN GPS CONFIGURATION BAR ── */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="size-4 text-primary" />
            <p className="text-sm font-semibold">Kitchen GPS Coordinates</p>
            <Badge variant="outline" className="font-mono text-xs">
              {kitchenLoc.lat}, {kitchenLoc.lng}
            </Badge>
          </div>
          {!isEditingKitchen ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setKitchenLat(String(kitchenLoc.lat))
                setKitchenLng(String(kitchenLoc.lng))
                setIsEditingKitchen(true)
              }}
            >
              Update GPS
            </Button>
          ) : null}
        </div>

        {isEditingKitchen && (
          <div className="flex items-end gap-3 pt-2">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Latitude</label>
              <Input
                type="number"
                step="0.000001"
                value={kitchenLat}
                onChange={(e) => setKitchenLat(e.target.value)}
                className="w-36 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Longitude</label>
              <Input
                type="number"
                step="0.000001"
                value={kitchenLng}
                onChange={(e) => setKitchenLng(e.target.value)}
                className="w-36 font-mono text-xs"
              />
            </div>
            <Button size="sm" onClick={handleSaveKitchenLocation} disabled={updateConfig.isPending}>
              Save GPS
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingKitchen(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* ── MAIN TABS ── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="pincodes" className="gap-2">
            <MapPin className="size-4" />
            Delivery Zones (Pincodes)
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <Calculator className="size-4" />
            Dynamic Pricing &amp; Rules
          </TabsTrigger>
          <TabsTrigger value="areas" className="gap-2">
            <Navigation className="size-4" />
            Named Localities ({areas?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: PINCODE DELIVERY ZONES (ZONE A & ZONE B)                    */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <TabsContent value="pincodes" className="space-y-6">
          {/* ZONE A */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-500 inline-block" />
                  <h3 className="font-bold text-base text-foreground">Zone A: Core Delivery Area</h3>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10 text-xs font-bold">
                    {deliveryForm.zone_a_pincodes.length} Pincodes
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Primary delivery area. Orders are automatically accepted. First <strong>{deliveryForm.free_delivery_radius_km} km</strong> is FREE; extra distance charged at <strong>{CURRENCY_SYMBOL}{deliveryForm.per_km_fee}/km</strong>.
                </p>
              </div>

              {/* Add Pincode to A */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Input
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={newPincodeA}
                  onChange={(e) => setNewPincodeA(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPincodeA()}
                  className="w-36 h-9 font-mono text-xs"
                />
                <Button size="sm" onClick={handleAddPincodeA} disabled={updateConfig.isPending}>
                  <Plus className="size-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Pincode Tag Pills for A */}
            <div className="flex flex-wrap gap-2 pt-1">
              {deliveryForm.zone_a_pincodes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No pincodes configured for Zone A yet. Enter a 6-digit pincode above to add.
                </p>
              ) : (
                deliveryForm.zone_a_pincodes.map((pin) => (
                  <div
                    key={pin}
                    className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition hover:bg-emerald-500/20"
                  >
                    <span>{pin}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePincodeA(pin)}
                      className="text-emerald-600 hover:text-destructive transition ml-1 p-0.5 rounded hover:bg-destructive/10"
                      title={`Remove ${pin}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ZONE B */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-amber-500 inline-block" />
                  <h3 className="font-bold text-base text-foreground">Zone B: Extended Delivery Area</h3>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10 text-xs font-bold">
                    {deliveryForm.zone_b_pincodes.length} Pincodes
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Extended reach. Same fair distance-based delivery fee as Zone A. Delivery takes 50–65 mins and order acceptance is subject to rider confirmation.
                </p>
              </div>

              {/* Add Pincode to B */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Input
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={newPincodeB}
                  onChange={(e) => setNewPincodeB(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPincodeB()}
                  className="w-36 h-9 font-mono text-xs"
                />
                <Button size="sm" onClick={handleAddPincodeB} disabled={updateConfig.isPending}>
                  <Plus className="size-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Pincode Tag Pills for B */}
            <div className="flex flex-wrap gap-2 pt-1">
              {deliveryForm.zone_b_pincodes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No pincodes configured for Zone B yet. Enter a 6-digit pincode above to add.
                </p>
              ) : (
                deliveryForm.zone_b_pincodes.map((pin) => (
                  <div
                    key={pin}
                    className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition hover:bg-amber-500/20"
                  >
                    <span>{pin}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePincodeB(pin)}
                      className="text-amber-600 hover:text-destructive transition ml-1 p-0.5 rounded hover:bg-destructive/10"
                      title={`Remove ${pin}`}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* OUT OF ZONE INFORMATION CARD */}
          <div className="rounded-xl border bg-muted/30 p-4 flex items-start gap-3">
            <HelpCircle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-foreground">How other pincodes are handled</p>
              <p className="text-muted-foreground leading-relaxed">
                Any pincode not listed in Zone A or Zone B is automatically classified as <strong>Outside Service Area</strong>. Regular meal orders are disabled, and the customer is shown your <strong>Party &amp; Bulk Catering banner</strong> with direct call CTA.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: DYNAMIC PRICING & RULES                                      */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRICING CONFIGURATION FORM */}
            <div className="rounded-xl border bg-card p-5 space-y-4">
              <h3 className="font-bold text-base text-foreground border-b pb-2">Pricing Parameters</h3>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-foreground">
                    Free Delivery Radius (km)
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={deliveryForm.free_delivery_radius_km}
                    onChange={(e) =>
                      setDeliveryForm({
                        ...deliveryForm,
                        free_delivery_radius_km: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Orders within this distance from the kitchen are FREE (₹0). Distance beyond this is charged at Base Fee + Per-Km rate.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium text-foreground">
                      Base Delivery Fee ({CURRENCY_SYMBOL})
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={deliveryForm.base_delivery_fee}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          base_delivery_fee: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 font-mono text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-foreground">
                      Per-Km Charge ({CURRENCY_SYMBOL}/km)
                    </Label>
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      value={deliveryForm.per_km_fee}
                      onChange={(e) =>
                        setDeliveryForm({
                          ...deliveryForm,
                          per_km_fee: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium text-foreground">
                    Maximum Delivery Cutoff (km)
                  </Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={deliveryForm.max_delivery_distance_km}
                    onChange={(e) =>
                      setDeliveryForm({
                        ...deliveryForm,
                        max_delivery_distance_km: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Any order exceeding this radius from the kitchen will be marked out of range.
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-medium text-foreground">
                    Party &amp; Bulk Orders Contact Phone
                  </Label>
                  <Input
                    type="text"
                    value={deliveryForm.party_order_phone || ''}
                    onChange={(e) =>
                      setDeliveryForm({
                        ...deliveryForm,
                        party_order_phone: e.target.value,
                      })
                    }
                    placeholder="e.g. +91 99999 99999"
                    className="mt-1 text-sm font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Displayed to customers who are outside regular individual delivery zones.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <Button variant="ghost" size="sm" onClick={handleResetDefaults} className="text-xs text-muted-foreground">
                  <RotateCcw className="size-3.5 mr-1" /> Reset Defaults
                </Button>
                <Button size="sm" onClick={handleSavePricing} disabled={updateConfig.isPending} className="gap-1.5">
                  <Save className="size-3.5" /> Save Pricing Rules
                </Button>
              </div>
            </div>

            {/* LIVE RATE SIMULATOR CARD */}
            <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Calculator className="size-4 text-primary" /> Live Pricing Calculator
                </h3>
                <Badge variant="outline" className="text-xs">Test Mode</Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-muted-foreground">Test Distance from Kitchen</span>
                    <span className="font-bold font-mono text-primary text-sm">{testDistance} km</span>
                  </div>
                  <Input
                    type="range"
                    min="0.5"
                    max={deliveryForm.max_delivery_distance_km || 15}
                    step="0.5"
                    value={testDistance}
                    onChange={(e) => setTestDistance(parseFloat(e.target.value))}
                    className="cursor-pointer"
                  />
                </div>

                {/* ZONE A BREAKDOWN */}
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 inline-block" />
                      Zone A (Core Delivery)
                    </span>
                    <Badge variant="secondary" className="font-bold text-xs">
                      Fee: {simulatedFee === 0 ? 'FREE (₹0)' : `${CURRENCY_SYMBOL}${simulatedFee}`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {testDistance <= deliveryForm.free_delivery_radius_km ? (
                      `✓ Distance (${testDistance} km) is within the free radius (${deliveryForm.free_delivery_radius_km} km). Orders accepted automatically.`
                    ) : (
                      `Base ${CURRENCY_SYMBOL}${deliveryForm.base_delivery_fee} + ${(testDistance - deliveryForm.free_delivery_radius_km).toFixed(1)} extra km × ${CURRENCY_SYMBOL}${deliveryForm.per_km_fee} = ${CURRENCY_SYMBOL}${simulatedFee} (Automatic acceptance, 30–45 mins ETA).`
                    )}
                  </p>
                </div>

                {/* ZONE B BREAKDOWN */}
                <div className="rounded-lg border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500 inline-block" />
                      Zone B (Extended Area)
                    </span>
                    <Badge variant="secondary" className="font-bold text-xs">
                      Fee: {simulatedFee === 0 ? 'FREE (₹0)' : `${CURRENCY_SYMBOL}${simulatedFee}`}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {testDistance <= deliveryForm.free_delivery_radius_km ? (
                      `✓ Distance (${testDistance} km) is within the free radius (${deliveryForm.free_delivery_radius_km} km). Same ₹0 rate. Operational note: 50–65 mins ETA, subject to rider confirmation.`
                    ) : (
                      `Same rate as Zone A: Base ${CURRENCY_SYMBOL}${deliveryForm.base_delivery_fee} + ${(testDistance - deliveryForm.free_delivery_radius_km).toFixed(1)} extra km × ${CURRENCY_SYMBOL}${deliveryForm.per_km_fee} = ${CURRENCY_SYMBOL}${simulatedFee}. Operational note: 50–65 mins ETA, subject to rider confirmation.`
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* KITCHEN LOCATION CONFIGURATION */}
            <div className="rounded-xl border bg-card p-5 space-y-4 md:col-span-2">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                    <MapPin className="size-4 text-primary" /> Central Kitchen Location
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sarita Apartments, Satya Marg, Bodakdev, Ahmedabad – 380015. Driving distance and delivery charges are computed from this pin.
                  </p>
                </div>
                {!isEditingKitchen && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setKitchenLat(String(kitchenLoc.lat))
                      setKitchenLng(String(kitchenLoc.lng))
                      setIsEditingKitchen(true)
                    }}
                  >
                    Edit Coordinates
                  </Button>
                )}
              </div>

              {isEditingKitchen ? (
                <div className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium">Kitchen Latitude</Label>
                      <Input
                        type="number"
                        step="0.0000001"
                        value={kitchenLat}
                        onChange={(e) => setKitchenLat(e.target.value)}
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Kitchen Longitude</Label>
                      <Input
                        type="number"
                        step="0.0000001"
                        value={kitchenLng}
                        onChange={(e) => setKitchenLng(e.target.value)}
                        className="mt-1 font-mono text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button size="sm" onClick={handleSaveKitchenLocation} disabled={updateConfig.isPending}>
                      <Save className="size-3.5 mr-1" /> Save Kitchen Location
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingKitchen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-muted/30 p-3 rounded-lg border">
                  <span><strong>Lat:</strong> {kitchenLoc.lat}</span>
                  <span><strong>Lng:</strong> {kitchenLoc.lng}</span>
                  <span className="text-muted-foreground font-sans text-xs">
                    (Sarita Apartments, Bodakdev)
                  </span>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: NAMED SERVICEABLE LOCALITIES                                 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <TabsContent value="areas" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              List of deliverable areas and localities for text matching (e.g. Bodakdev, Satellite, Vastrapur).
            </p>
            <div className="flex items-center gap-2">
              <div className="relative max-w-xs">
                <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
                <Input
                  placeholder="Search area..."
                  value={areaSearch}
                  onChange={(e) => setAreaSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button size="sm" onClick={openCreateArea} className="shrink-0">
                <Plus className="size-4" />
                Add Area
              </Button>
            </div>
          </div>

          {!areasPending && !areas?.length ? (
            <EmptyState
              icon={MapPin}
              title="No serviceable areas configured"
              description="Add named localities to enable delivery text matching."
              action={
                <Button size="sm" onClick={openCreateArea}>
                  <Plus className="size-4" /> Add Area
                </Button>
              }
              className="border-none py-10"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Area Name</TableHead>
                    <TableHead>Area Match Key</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Zone Classification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAreas.map((a) => {
                    const isZoneA = a.pincode && deliveryForm.zone_a_pincodes.includes(a.pincode.trim())
                    const isZoneB = a.pincode && deliveryForm.zone_b_pincodes.includes(a.pincode.trim())
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-semibold">{a.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">{a.area_key || a.name.toLowerCase()}</Badge>
                        </TableCell>
                        <TableCell className="font-mono">{a.pincode || '—'}</TableCell>
                        <TableCell>
                          {isZoneA ? (
                            <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10 text-xs">
                              Zone A (Core)
                            </Badge>
                          ) : isZoneB ? (
                            <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-500/10 text-xs">
                              Zone B (Extended)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-muted-foreground">
                              Standard
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => updateArea.mutate({ id: a.id, input: { is_active: !a.is_active } })}
                          >
                            <Badge variant={a.is_active ? 'secondary' : 'outline'}>
                              {a.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditArea(a)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletingArea(a)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── DIALOGS ── */}
      {/* Create / Edit Area Dialog */}
      <Dialog open={areaFormOpen} onOpenChange={setAreaFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Edit Delivery Area' : 'Add Delivery Area'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Area Name *</label>
              <Input
                placeholder="e.g. Bodakdev"
                value={areaForm.name}
                onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Area Key (for text matching)</label>
              <Input
                placeholder="e.g. bodakdev"
                value={areaForm.area_key}
                onChange={(e) => setAreaForm({ ...areaForm, area_key: e.target.value })}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Pincode Hint</label>
              <Input
                placeholder="e.g. 380054"
                value={areaForm.pincode}
                onChange={(e) => setAreaForm({ ...areaForm, pincode: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveArea} disabled={!areaForm.name.trim() || createArea.isPending || updateArea.isPending}>
              {editingArea ? 'Save Changes' : 'Create Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingArea)}
        onOpenChange={(open) => !open && setDeletingArea(null)}
        title="Delete area?"
        description={`"${deletingArea?.name}" will be removed from deliverable areas.`}
        confirmLabel="Delete Area"
        isLoading={deleteArea.isPending}
        onConfirm={() => deletingArea && deleteArea.mutate(deletingArea.id, { onSuccess: () => setDeletingArea(null) })}
      />
    </div>
  )
}
