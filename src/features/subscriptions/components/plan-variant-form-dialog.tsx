import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VariantCardPreview } from './variant-card-preview'
import { useCreatePlanVariant, useUpdatePlanVariant } from '../hooks/use-subscriptions'
import type { PlanVariantRow } from '@/types/database.types'

type PlanVariantFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant: PlanVariantRow | null
}

const WEEKDAYS = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 7, label: 'Sun' },
]

export function PlanVariantFormDialog({
  open,
  onOpenChange,
  variant,
}: PlanVariantFormDialogProps) {
  const createMutation = useCreatePlanVariant()
  const updateMutation = useUpdatePlanVariant()

  const [formData, setFormData] = useState<Partial<PlanVariantRow>>({
    name: '',
    slug: '',
    short_description: '',
    who_it_is_for: '',
    badge_text: '',
    display_order: 1,
    is_active: true,
    duration_meal_days: 15,
    schedule_type: 'weekdays_selection',
    delivery_days: [1, 2, 3, 4, 5],
    discount_percentage: 15,
    skip_limit: 2,
    has_weekly_sweet: false,
    meal_slots_allowed: ['lunch', 'dinner', 'both'],
    renewal_reminder_threshold: 3,
  })

  useEffect(() => {
    if (variant) {
      setFormData(variant)
    } else {
      setFormData({
        name: '',
        slug: '',
        short_description: '',
        who_it_is_for: '',
        badge_text: '',
        display_order: 1,
        is_active: true,
        duration_meal_days: 15,
        schedule_type: 'weekdays_selection',
        delivery_days: [1, 2, 3, 4, 5],
        discount_percentage: 15,
        skip_limit: 2,
        has_weekly_sweet: false,
        meal_slots_allowed: ['lunch', 'dinner', 'both'],
        renewal_reminder_threshold: 3,
      })
    }
  }, [variant, open])

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: variant ? prev.slug : val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    }))
  }

  const toggleWeekday = (day: number) => {
    const current = formData.delivery_days || []
    if (current.includes(day)) {
      if (current.length === 1) return // Keep at least 1 day
      setFormData((prev) => ({ ...prev, delivery_days: current.filter((d) => d !== day) }))
    } else {
      setFormData((prev) => ({ ...prev, delivery_days: [...current, day].sort() }))
    }
  }

  const toggleMealSlot = (slot: string) => {
    const current = formData.meal_slots_allowed || []
    if (current.includes(slot)) {
      if (current.length === 1) return
      setFormData((prev) => ({ ...prev, meal_slots_allowed: current.filter((s) => s !== slot) }))
    } else {
      setFormData((prev) => ({ ...prev, meal_slots_allowed: [...current, slot] }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.slug || !formData.duration_meal_days) return

    if (variant) {
      await updateMutation.mutateAsync({
        id: variant.id,
        input: {
          name: formData.name,
          slug: formData.slug,
          short_description: formData.short_description || '',
          who_it_is_for: formData.who_it_is_for || '',
          badge_text: formData.badge_text || null,
          display_order: Number(formData.display_order) || 0,
          is_active: formData.is_active ?? true,
          duration_meal_days: Number(formData.duration_meal_days),
          schedule_type: formData.schedule_type as any,
          delivery_days: formData.delivery_days || [1, 2, 3, 4, 5],
          discount_percentage: Number(formData.discount_percentage) || 0,
          skip_limit: Number(formData.skip_limit) || 0,
          has_weekly_sweet: Boolean(formData.has_weekly_sweet),
          meal_slots_allowed: formData.meal_slots_allowed || ['lunch', 'dinner', 'both'],
          renewal_reminder_threshold: Number(formData.renewal_reminder_threshold) || 3,
        },
      })
    } else {
      await createMutation.mutateAsync({
        name: formData.name,
        slug: formData.slug,
        short_description: formData.short_description || '',
        who_it_is_for: formData.who_it_is_for || '',
        badge_text: formData.badge_text || null,
        display_order: Number(formData.display_order) || 0,
        is_active: formData.is_active ?? true,
        duration_meal_days: Number(formData.duration_meal_days),
        schedule_type: formData.schedule_type as any,
        delivery_days: formData.delivery_days || [1, 2, 3, 4, 5],
        discount_percentage: Number(formData.discount_percentage) || 0,
        skip_limit: Number(formData.skip_limit) || 0,
        has_weekly_sweet: Boolean(formData.has_weekly_sweet),
        meal_slots_allowed: formData.meal_slots_allowed || ['lunch', 'dinner', 'both'],
        renewal_reminder_threshold: Number(formData.renewal_reminder_threshold) || 3,
      })
    }
    onOpenChange(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {variant ? `Edit Variant: ${variant.name}` : 'Create Plan Variant'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          {/* Left Column: Form Controls */}
          <form id="variant-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="var-name">Plan Name *</Label>
                <Input
                  id="var-name"
                  value={formData.name || ''}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Corporate"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="var-slug">URL Slug *</Label>
                <Input
                  id="var-slug"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="e.g. corporate"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="var-target">"Who It Is For" Label *</Label>
                <Input
                  id="var-target"
                  value={formData.who_it_is_for || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, who_it_is_for: e.target.value }))}
                  placeholder="e.g. For office goers (Mon-Fri)"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="var-badge">Badge Text (Optional)</Label>
                <Input
                  id="var-badge"
                  value={formData.badge_text || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, badge_text: e.target.value }))}
                  placeholder="e.g. Most Popular"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="var-desc">Short Description *</Label>
              <Textarea
                id="var-desc"
                rows={2}
                value={formData.short_description || ''}
                onChange={(e) => setFormData((p) => ({ ...p, short_description: e.target.value }))}
                placeholder="Brief summary of the plan's benefits..."
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="var-duration">Duration (Meal-Days) *</Label>
                <Input
                  id="var-duration"
                  type="number"
                  min={1}
                  value={formData.duration_meal_days ?? 15}
                  onChange={(e) => setFormData((p) => ({ ...p, duration_meal_days: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="var-discount">Discount % *</Label>
                <Input
                  id="var-discount"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={formData.discount_percentage ?? 0}
                  onChange={(e) => setFormData((p) => ({ ...p, discount_percentage: parseFloat(e.target.value) || 0 }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="var-skips">Skip Limit *</Label>
                <Input
                  id="var-skips"
                  type="number"
                  min={0}
                  value={formData.skip_limit ?? 2}
                  onChange={(e) => setFormData((p) => ({ ...p, skip_limit: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>
            </div>

            {/* Schedule Pattern */}
            <div className="rounded-lg border p-3 space-y-3 bg-muted/20">
              <div className="space-y-1.5">
                <Label htmlFor="var-schedule">Schedule Pattern *</Label>
                <Select
                  value={formData.schedule_type}
                  onValueChange={(val: any) => setFormData((p) => ({ ...p, schedule_type: val }))}
                >
                  <SelectTrigger id="var-schedule">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekdays_selection">Specific Weekdays (e.g. Mon-Fri or All 7 Days)</SelectItem>
                    <SelectItem value="every_other_day">Alternate Days (Every 2nd Day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.schedule_type === 'weekdays_selection' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Select Delivery Weekdays:</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((w) => {
                      const selected = (formData.delivery_days || []).includes(w.day)
                      return (
                        <button
                          key={w.day}
                          type="button"
                          onClick={() => toggleWeekday(w.day)}
                          className={`size-9 rounded-md text-xs font-semibold transition-colors flex items-center justify-center border ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted text-muted-foreground border-input'
                          }`}
                        >
                          {w.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Meal Slots Allowed */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Allowed Meal Slots:</Label>
              <div className="flex flex-wrap gap-3">
                {['lunch', 'dinner', 'both'].map((slot) => {
                  const checked = (formData.meal_slots_allowed || []).includes(slot)
                  return (
                    <label key={slot} className="flex items-center gap-2 text-sm cursor-pointer capitalize">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMealSlot(slot)}
                        className="rounded border-input text-primary focus:ring-primary size-4"
                      />
                      <span>{slot === 'both' ? 'Both (Lunch & Dinner)' : slot}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Weekly Sweet & Reminder Threshold */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="sweet-toggle" className="text-sm font-medium">Weekly Sweet</Label>
                  <p className="text-[11px] text-muted-foreground">Complimentary sweet reward</p>
                </div>
                <Switch
                  id="sweet-toggle"
                  checked={Boolean(formData.has_weekly_sweet)}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, has_weekly_sweet: checked }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="var-threshold">Renewal Alert (Remaining Meals)</Label>
                <Input
                  id="var-threshold"
                  type="number"
                  min={1}
                  value={formData.renewal_reminder_threshold ?? 3}
                  onChange={(e) => setFormData((p) => ({ ...p, renewal_reminder_threshold: parseInt(e.target.value) || 3 }))}
                />
              </div>
            </div>

            {/* Complimentary Add-ons in Plans Info */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300">
              <Sparkles className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <span className="font-semibold">Complimentary Add-ons: </span>
                All plans automatically provide complimentary daily add-ons (Fresh Salad, Homemade Pickle &amp; Chutney) with every thali. Snacks/farsan are optional retail add-ons.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="var-order">Display Sort Order</Label>
                <Input
                  id="var-order"
                  type="number"
                  value={formData.display_order ?? 0}
                  onChange={(e) => setFormData((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="active-toggle" className="text-sm font-medium">Active Status</Label>
                  <p className="text-[11px] text-muted-foreground">Visible on customer app</p>
                </div>
                <Switch
                  id="active-toggle"
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
                />
              </div>
            </div>
          </form>

          {/* Right Column: Live Card Preview */}
          <div className="lg:col-span-5 border-l pl-0 lg:pl-6">
            <VariantCardPreview variant={formData} />
          </div>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="variant-form" disabled={isPending}>
            {isPending ? 'Saving...' : variant ? 'Update Variant' : 'Create Variant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
