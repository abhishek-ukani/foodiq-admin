import { useState, useMemo } from 'react'
import { MapPin, MoreHorizontal, Plus, Search, CheckCircle2, ShieldAlert, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  useDeliveryZones,
  useCreateDeliveryZone,
  useUpdateDeliveryZone,
  useDeleteDeliveryZone,
  useDeliveryFeeRules,
  useCreateDeliveryFeeRule,
  useUpdateDeliveryFeeRule,
  useDeleteDeliveryFeeRule,
} from '@/features/settings/hooks/use-delivery'
import { CURRENCY_SYMBOL } from '@/constants'
import type { Tables } from '@/types/database.types'

type Area = Tables<'delivery_areas'>
type Zone = Tables<'delivery_zones'>
type FeeRule = Tables<'delivery_fee_rules'>

const EMPTY_AREA_FORM = {
  name: '',
  pincode: '',
  city: 'Surat',
  state: 'Gujarat',
  delivery_charge: 20,
  min_order_amount: 100,
  free_delivery_above: '' as number | '',
  estimated_minutes: '' as number | '',
}

const EMPTY_ZONE_FORM = {
  name: '',
  pincode: '',
  zone_type: 'PAID' as 'FREE' | 'PAID' | 'BLOCKED',
  fixed_fee: 30,
}

const EMPTY_RULE_FORM = {
  min_distance_km: 0,
  max_distance_km: 5,
  fee: 25,
}

export function DeliveryAreasTab() {
  const [activeTab, setActiveTab] = useState<'zones' | 'rules' | 'areas'>('zones')

  // Data queries
  const { data: zones, isPending: zonesPending } = useDeliveryZones()
  const { data: rules, isPending: rulesPending } = useDeliveryFeeRules()
  const { data: areas, isPending: areasPending } = useDeliveryAreas()

  // Mutations - Zones
  const createZone = useCreateDeliveryZone()
  const updateZone = useUpdateDeliveryZone()
  const deleteZone = useDeleteDeliveryZone()

  // Mutations - Rules
  const createRule = useCreateDeliveryFeeRule()
  const updateRule = useUpdateDeliveryFeeRule()
  const deleteRule = useDeleteDeliveryFeeRule()

  // Mutations - Areas
  const createArea = useCreateDeliveryArea()
  const updateArea = useUpdateDeliveryArea()
  const deleteArea = useDeleteDeliveryArea()

  // State - Zones
  const [zoneSearch, setZoneSearch] = useState('')
  const [zoneFormOpen, setZoneFormOpen] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null)
  const [zoneForm, setZoneForm] = useState(EMPTY_ZONE_FORM)

  // State - Rules
  const [ruleFormOpen, setRuleFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<FeeRule | null>(null)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE_FORM)

  // State - Areas
  const [areaSearch, setAreaSearch] = useState('')
  const [areaFormOpen, setAreaFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deletingArea, setDeletingArea] = useState<Area | null>(null)
  const [areaForm, setAreaForm] = useState(EMPTY_AREA_FORM)

  // Filtered lists
  const filteredZones = useMemo(() => {
    if (!zones) return []
    if (!zoneSearch.trim()) return zones
    const q = zoneSearch.toLowerCase().trim()
    return zones.filter(
      (z) => z.name.toLowerCase().includes(q) || z.pincode?.toLowerCase().includes(q),
    )
  }, [zones, zoneSearch])

  const filteredAreas = useMemo(() => {
    if (!areas) return []
    if (!areaSearch.trim()) return areas
    const q = areaSearch.toLowerCase().trim()
    return areas.filter(
      (a) => a.name.toLowerCase().includes(q) || a.pincode.toLowerCase().includes(q),
    )
  }, [areas, areaSearch])

  // --- Handlers - Zones ---
  const openCreateZone = () => {
    setEditingZone(null)
    setZoneForm(EMPTY_ZONE_FORM)
    setZoneFormOpen(true)
  }

  const openEditZone = (zone: Zone) => {
    setEditingZone(zone)
    setZoneForm({
      name: zone.name,
      pincode: zone.pincode ?? '',
      zone_type: zone.zone_type,
      fixed_fee: zone.fixed_fee,
    })
    setZoneFormOpen(true)
  }

  const handleSaveZone = () => {
    const payload = {
      name: zoneForm.name.trim(),
      pincode: zoneForm.pincode.trim() || null,
      zone_type: zoneForm.zone_type,
      fixed_fee: zoneForm.zone_type === 'PAID' ? Number(zoneForm.fixed_fee) : 0,
    }
    if (editingZone) {
      updateZone.mutate({ id: editingZone.id, input: payload }, { onSuccess: () => setZoneFormOpen(false) })
    } else {
      createZone.mutate(payload, { onSuccess: () => setZoneFormOpen(false) })
    }
  }

  // --- Handlers - Fee Rules ---
  const openCreateRule = () => {
    setEditingRule(null)
    setRuleForm(EMPTY_RULE_FORM)
    setRuleFormOpen(true)
  }

  const openEditRule = (rule: FeeRule) => {
    setEditingRule(rule)
    setRuleForm({
      min_distance_km: rule.min_distance_km,
      max_distance_km: rule.max_distance_km,
      fee: rule.fee,
    })
    setRuleFormOpen(true)
  }

  const handleSaveRule = () => {
    const payload = {
      min_distance_km: Number(ruleForm.min_distance_km),
      max_distance_km: Number(ruleForm.max_distance_km),
      fee: Number(ruleForm.fee),
    }
    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, input: payload }, { onSuccess: () => setRuleFormOpen(false) })
    } else {
      createRule.mutate(payload, { onSuccess: () => setRuleFormOpen(false) })
    }
  }

  // --- Handlers - Areas ---
  const openCreateArea = () => {
    setEditingArea(null)
    setAreaForm(EMPTY_AREA_FORM)
    setAreaFormOpen(true)
  }

  const openEditArea = (area: Area) => {
    setEditingArea(area)
    setAreaForm({
      name: area.name,
      pincode: area.pincode,
      city: area.city ?? 'Surat',
      state: area.state ?? 'Gujarat',
      delivery_charge: area.delivery_charge,
      min_order_amount: area.min_order_amount,
      free_delivery_above: area.free_delivery_above ?? '',
      estimated_minutes: area.estimated_minutes ?? '',
    })
    setAreaFormOpen(true)
  }

  const handleSaveArea = () => {
    const payload = {
      name: areaForm.name,
      pincode: areaForm.pincode,
      city: areaForm.city || null,
      state: areaForm.state || null,
      delivery_charge: areaForm.delivery_charge,
      min_order_amount: areaForm.min_order_amount,
      free_delivery_above: areaForm.free_delivery_above === '' ? null : Number(areaForm.free_delivery_above),
      estimated_minutes: areaForm.estimated_minutes === '' ? null : Number(areaForm.estimated_minutes),
    }
    if (editingArea) {
      updateArea.mutate({ id: editingArea.id, input: payload }, { onSuccess: () => setAreaFormOpen(false) })
    } else {
      createArea.mutate(payload, { onSuccess: () => setAreaFormOpen(false) })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3.5">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Locality Zones</p>
            <p className="text-2xl font-bold">{zones?.length ?? 0}</p>
          </div>
          <MapPin className="text-primary/70 size-6" />
        </div>
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3.5">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Distance Fee Tiers</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{rules?.length ?? 0}</p>
          </div>
          <Navigation className="size-6 text-emerald-500" />
        </div>
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-3.5">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Legacy Areas</p>
            <p className="text-2xl font-bold">{areas?.length ?? 0}</p>
          </div>
          <CheckCircle2 className="text-primary/70 size-6" />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'zones' | 'rules' | 'areas')}>
        <TabsList className="mb-4">
          <TabsTrigger value="zones" className="gap-2">
            <MapPin className="size-4" />
            Locality Zones ({zones?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Navigation className="size-4" />
            Distance Tiers ({rules?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="areas" className="gap-2">
            Legacy Neighborhoods ({areas?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: LOCALITY ZONES */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="zones" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
              <Input
                placeholder="Search zone locality or pincode..."
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm" onClick={openCreateZone} className="shrink-0">
              <Plus className="size-4" aria-hidden />
              Add Locality Zone
            </Button>
          </div>

          {!zonesPending && !zones?.length ? (
            <EmptyState
              icon={MapPin}
              title="No locality zones configured"
              description="Add pre-classified delivery localities (Free, Flat Paid, or Blocked)."
              action={
                <Button size="sm" onClick={openCreateZone}>
                  <Plus className="size-4" /> Add Locality Zone
                </Button>
              }
              className="border-none py-10"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Locality / Zone Name</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Zone Type</TableHead>
                    <TableHead>Fixed Delivery Charge</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-semibold">{zone.name}</TableCell>
                      <TableCell>
                        {zone.pincode ? (
                          <Badge variant="outline" className="font-mono text-xs">
                            {zone.pincode}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            zone.zone_type === 'FREE'
                              ? 'secondary'
                              : zone.zone_type === 'BLOCKED'
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {zone.zone_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {zone.zone_type === 'BLOCKED'
                          ? '—'
                          : zone.zone_type === 'FREE'
                          ? '₹0 (Free)'
                          : `${CURRENCY_SYMBOL}${zone.fixed_fee}`}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => updateZone.mutate({ id: zone.id, input: { is_active: !zone.is_active } })}
                          className="inline-flex cursor-pointer items-center gap-1.5"
                        >
                          <Badge variant={zone.is_active ? 'secondary' : 'outline'}>
                            {zone.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditZone(zone)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateZone.mutate({ id: zone.id, input: { is_active: !zone.is_active } })}>
                              {zone.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingZone(zone)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: DISTANCE FEE RULES */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              Distance-based fallback tiers consulted when no exact zone match exists.
            </p>
            <Button size="sm" onClick={openCreateRule} className="shrink-0">
              <Plus className="size-4" />
              Add Distance Tier
            </Button>
          </div>

          {!rulesPending && !rules?.length ? (
            <EmptyState
              icon={Navigation}
              title="No distance fee tiers configured"
              description="Add distance ranges (e.g., 0-2 km: ₹0, 2-5 km: ₹30)."
              action={
                <Button size="sm" onClick={openCreateRule}>
                  <Plus className="size-4" /> Add Distance Tier
                </Button>
              }
              className="border-none py-10"
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Min Distance</TableHead>
                    <TableHead>Max Distance</TableHead>
                    <TableHead>Delivery Fee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.min_distance_km} km</TableCell>
                      <TableCell className="font-medium">{rule.max_distance_km} km</TableCell>
                      <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {rule.fee === 0 ? 'Free (₹0)' : `${CURRENCY_SYMBOL}${rule.fee}`}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => updateRule.mutate({ id: rule.id, input: { is_active: !rule.is_active } })}
                        >
                          <Badge variant={rule.is_active ? 'secondary' : 'outline'}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditRule(rule)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateRule.mutate({ id: rule.id, input: { is_active: !rule.is_active } })}>
                              {rule.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingRule(rule)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 3: LEGACY AREAS */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="areas" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
              <Input
                placeholder="Search legacy area..."
                value={areaSearch}
                onChange={(e) => setAreaSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button size="sm" onClick={openCreateArea} className="shrink-0">
              <Plus className="size-4" />
              Add Legacy Area
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Area Name</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Delivery Charge</TableHead>
                  <TableHead>Min Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-semibold">{area.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{area.pincode}</Badge>
                    </TableCell>
                    <TableCell>{area.city ?? 'Surat'}</TableCell>
                    <TableCell>{CURRENCY_SYMBOL}{area.delivery_charge}</TableCell>
                    <TableCell>{CURRENCY_SYMBOL}{area.min_order_amount}</TableCell>
                    <TableCell>
                      <Badge variant={area.is_active ? 'secondary' : 'outline'}>
                        {area.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditArea(area)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeletingArea(area)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- Dialog: Zone Form --- */}
      <Dialog open={zoneFormOpen} onOpenChange={setZoneFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Locality Zone' : 'Add Locality Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Locality / Zone Name *</label>
              <Input
                placeholder="e.g. Bopal or Adajan"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Pincode (optional)</label>
              <Input
                placeholder="e.g. 380058"
                value={zoneForm.pincode}
                onChange={(e) => setZoneForm({ ...zoneForm, pincode: e.target.value })}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Zone Type *</label>
              <select
                className="w-full rounded-md border p-2 text-sm"
                value={zoneForm.zone_type}
                onChange={(e) => setZoneForm({ ...zoneForm, zone_type: e.target.value as 'FREE' | 'PAID' | 'BLOCKED' })}
              >
                <option value="FREE">FREE — No delivery charge</option>
                <option value="PAID">PAID — Fixed delivery charge</option>
                <option value="BLOCKED">BLOCKED — Non-deliverable area</option>
              </select>
            </div>
            {zoneForm.zone_type === 'PAID' && (
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">Fixed Delivery Fee ({CURRENCY_SYMBOL}) *</label>
                <Input
                  type="number"
                  placeholder="30"
                  value={zoneForm.fixed_fee}
                  onChange={(e) => setZoneForm({ ...zoneForm, fixed_fee: e.target.valueAsNumber || 0 })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveZone} disabled={!zoneForm.name.trim() || createZone.isPending || updateZone.isPending}>
              {editingZone ? 'Save Changes' : 'Add Zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Distance Rule Form --- */}
      <Dialog open={ruleFormOpen} onOpenChange={setRuleFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Distance Tier' : 'Add Distance Tier'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">Min Distance (km) *</label>
                <Input
                  type="number"
                  step="0.1"
                  value={ruleForm.min_distance_km}
                  onChange={(e) => setRuleForm({ ...ruleForm, min_distance_km: e.target.valueAsNumber || 0 })}
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">Max Distance (km) *</label>
                <Input
                  type="number"
                  step="0.1"
                  value={ruleForm.max_distance_km}
                  onChange={(e) => setRuleForm({ ...ruleForm, max_distance_km: e.target.valueAsNumber || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Fee ({CURRENCY_SYMBOL}) *</label>
              <Input
                type="number"
                value={ruleForm.fee}
                onChange={(e) => setRuleForm({ ...ruleForm, fee: e.target.valueAsNumber || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} disabled={createRule.isPending || updateRule.isPending}>
              {editingRule ? 'Save Changes' : 'Add Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Area Form --- */}
      <Dialog open={areaFormOpen} onOpenChange={setAreaFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingArea ? 'Edit Legacy Area' : 'Add Legacy Area'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">Area Name *</label>
                <Input
                  placeholder="e.g. Adajan"
                  value={areaForm.name}
                  onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1 block text-xs font-medium">Pincode *</label>
                <Input
                  placeholder="e.g. 395009"
                  value={areaForm.pincode}
                  onChange={(e) => setAreaForm({ ...areaForm, pincode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAreaFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveArea} disabled={!areaForm.name.trim() || !areaForm.pincode.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={Boolean(deletingZone)}
        onOpenChange={(open) => !open && setDeletingZone(null)}
        title="Delete this zone?"
        description={`"${deletingZone?.name}" zone rule will be deleted.`}
        confirmLabel="Delete Zone"
        isLoading={deleteZone.isPending}
        onConfirm={() => deletingZone && deleteZone.mutate(deletingZone.id, { onSuccess: () => setDeletingZone(null) })}
      />

      <ConfirmDialog
        open={Boolean(deletingRule)}
        onOpenChange={(open) => !open && setDeletingRule(null)}
        title="Delete this distance tier?"
        description={`Tier ${deletingRule?.min_distance_km} - ${deletingRule?.max_distance_km} km will be deleted.`}
        confirmLabel="Delete Tier"
        isLoading={deleteRule.isPending}
        onConfirm={() => deletingRule && deleteRule.mutate(deletingRule.id, { onSuccess: () => setDeletingRule(null) })}
      />

      <ConfirmDialog
        open={Boolean(deletingArea)}
        onOpenChange={(open) => !open && setDeletingArea(null)}
        title="Delete area?"
        description={`"${deletingArea?.name}" will be deleted.`}
        confirmLabel="Delete Area"
        isLoading={deleteArea.isPending}
        onConfirm={() => deletingArea && deleteArea.mutate(deletingArea.id, { onSuccess: () => setDeletingArea(null) })}
      />
    </div>
  )
}
