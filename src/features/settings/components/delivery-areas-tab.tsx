import { useState, useMemo } from 'react'
import { MapPin, MoreHorizontal, Navigation, Plus, Search } from 'lucide-react'
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
  useDeliveryFeeRules,
  useCreateDeliveryFeeRule,
  useUpdateDeliveryFeeRule,
  useDeleteDeliveryFeeRule,
} from '@/features/settings/hooks/use-delivery'
import { useSystemConfig, useUpdateSystemConfig } from '@/features/settings/hooks/use-settings'
import { CURRENCY_SYMBOL } from '@/constants'
import type { Tables } from '@/types/database.types'

type Area = Tables<'delivery_areas'>
type FeeRule = Tables<'delivery_fee_rules'>

const EMPTY_AREA_FORM = {
  name: '',
  area_key: '',
  pincode: '',
  city: 'Ahmedabad',
  state: 'Gujarat',
}

const EMPTY_RULE_FORM = {
  min_distance_km: 0,
  max_distance_km: 5,
  fee: 25,
}

export function DeliveryAreasTab() {
  const [activeTab, setActiveTab] = useState<'areas' | 'rules'>('areas')

  // Queries
  const { data: areas, isPending: areasPending } = useDeliveryAreas()
  const { data: rules, isPending: rulesPending } = useDeliveryFeeRules()
  const { data: configData } = useSystemConfig()

  // Mutations - Areas
  const createArea = useCreateDeliveryArea()
  const updateArea = useUpdateDeliveryArea()
  const deleteArea = useDeleteDeliveryArea()

  // Mutations - Fee Rules
  const createRule = useCreateDeliveryFeeRule()
  const updateRule = useUpdateDeliveryFeeRule()
  const deleteRule = useDeleteDeliveryFeeRule()

  // Mutation - System Config (Kitchen Location)
  const updateConfig = useUpdateSystemConfig()

  // Search State
  const [areaSearch, setAreaSearch] = useState('')

  // Dialog State - Areas
  const [areaFormOpen, setAreaFormOpen] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [deletingArea, setDeletingArea] = useState<Area | null>(null)
  const [areaForm, setAreaForm] = useState(EMPTY_AREA_FORM)

  // Dialog State - Rules
  const [ruleFormOpen, setRuleFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<FeeRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<FeeRule | null>(null)
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE_FORM)

  // Kitchen location state
  const kitchenLoc = useMemo(() => {
    const item = configData?.find((c) => c.key === 'kitchen_location')
    if (!item?.value) return { lat: 23.0392, lng: 72.5085 }
    const val = item.value as any
    return { lat: Number(val.lat ?? 23.0392), lng: Number(val.lng ?? 72.5085) }
  }, [configData])

  const [kitchenLat, setKitchenLat] = useState<string>('')
  const [kitchenLng, setKitchenLng] = useState<string>('')
  const [isEditingKitchen, setIsEditingKitchen] = useState(false)

  // Filtered lists
  const filteredAreas = useMemo(() => {
    if (!areas) return []
    if (!areaSearch.trim()) return areas
    const q = areaSearch.toLowerCase().trim()
    return areas.filter(
      (a) => a.name.toLowerCase().includes(q) || a.area_key?.toLowerCase().includes(q),
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

  // --- Rule Handlers ---
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

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Serviceable Areas</p>
            <p className="text-2xl font-bold">{areas?.length ?? 0}</p>
          </div>
          <MapPin className="text-primary/70 size-6" />
        </div>
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Distance Fee Tiers</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{rules?.length ?? 0}</p>
          </div>
          <Navigation className="size-6 text-emerald-500" />
        </div>
        <div className="bg-muted/40 flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Kitchen Location</p>
            <p className="font-mono text-sm font-semibold mt-1">
              {kitchenLoc.lat.toFixed(4)}, {kitchenLoc.lng.toFixed(4)}
            </p>
          </div>
          <Navigation className="text-primary/70 size-6" />
        </div>
      </div>

      {/* Kitchen GPS Location Configuration */}
      <div className="rounded-lg border bg-muted/20 p-4 space-y-2">
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
              Update Location
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Used as the origin to calculate Haversine distance for distance-based delivery orders.
        </p>

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
              Save Coordinates
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingKitchen(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="areas" className="gap-2">
            <MapPin className="size-4" />
            Serviceable Areas ({areas?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Navigation className="size-4" />
            Distance Fee Tiers ({rules?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: SERVICEABLE AREAS */}
        {/* ------------------------------------------------------------------ */}
        <TabsContent value="areas" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              List of deliverable areas and localities. Standard distance fee pricing is applied from the kitchen origin.
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
              description="Add named localities (e.g. Bodakdev, Satellite, Vastrapur) to enable delivery."
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
                    <TableHead>Pincode Hint</TableHead>
                    <TableHead>Pricing Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAreas.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-semibold">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">{a.area_key || a.name.toLowerCase()}</Badge>
                      </TableCell>
                      <TableCell>{a.pincode || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        📐 Distance-based (from Kitchen)
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
            <p className="text-muted-foreground text-xs">
              Distance-based fee tiers calculated using the distance from the kitchen coordinates.
            </p>
            <Button size="sm" onClick={openCreateRule} className="shrink-0">
              <Plus className="size-4" />
              Add Distance Tier
            </Button>
          </div>

          {!rulesPending && !rules?.length ? (
            <EmptyState
              icon={Navigation}
              title="No distance fee rules"
              description="Add distance ranges (e.g. 0-2 km: ₹0, 2-5 km: ₹30)."
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
                            <Button variant="ghost" size="icon"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditRule(rule)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeletingRule(rule)}>Delete</DropdownMenuItem>
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
      </Tabs>

      {/* --- Dialog: Area Form --- */}
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
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Area Match Key (lowercase, no spaces)</label>
              <Input
                placeholder="e.g. bodakdev"
                value={areaForm.area_key}
                onChange={(e) => setAreaForm({ ...areaForm, area_key: e.target.value })}
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs font-medium">Pincode Hint (optional)</label>
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
              {editingArea ? 'Save Changes' : 'Add Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- Dialog: Rule Form --- */}
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

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={Boolean(deletingArea)}
        onOpenChange={(open) => !open && setDeletingArea(null)}
        title="Delete area?"
        description={`"${deletingArea?.name}" will be removed from deliverable areas.`}
        confirmLabel="Delete Area"
        isLoading={deleteArea.isPending}
        onConfirm={() => deletingArea && deleteArea.mutate(deletingArea.id, { onSuccess: () => setDeletingArea(null) })}
      />

      <ConfirmDialog
        open={Boolean(deletingRule)}
        onOpenChange={(open) => !open && setDeletingRule(null)}
        title="Delete tier?"
        description={`Tier ${deletingRule?.min_distance_km}-${deletingRule?.max_distance_km} km will be deleted.`}
        confirmLabel="Delete Tier"
        isLoading={deleteRule.isPending}
        onConfirm={() => deletingRule && deleteRule.mutate(deletingRule.id, { onSuccess: () => setDeletingRule(null) })}
      />
    </div>
  )
}
