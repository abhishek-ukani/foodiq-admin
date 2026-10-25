import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Phone, Sparkles, AlertCircle, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useSubscriptionSettings,
  useUpdateSubscriptionSettings,
  useFoodItemsForSelection,
} from '../hooks/use-subscriptions'
import type { SubscriptionSettingsRow } from '@/types/database.types'

export function GlobalSettingsTab() {
  const navigate = useNavigate()
  const { data: settings, isLoading } = useSubscriptionSettings()
  const { data: foodItems } = useFoodItemsForSelection()
  const updateMutation = useUpdateSubscriptionSettings()

  const [formData, setFormData] = useState<Partial<SubscriptionSettingsRow>>({
    lunch_skip_cutoff_time: '10:00:00',
    dinner_skip_cutoff_time: '19:00:00',
    min_lead_days: 1,
    max_start_lead_days: 30,
    allow_undo_skip: true,
    allow_skip_on_last_day: false,
    default_meal_thali_id: null,
    sweet_food_item_id: null,
    sweet_weekday_rule: 'first_delivery_of_week',
    contact_whatsapp_number: '+91 98765 43210',
  })

  useEffect(() => {
    if (settings) {
      setFormData(settings)
    }
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateMutation.mutateAsync({
      lunch_skip_cutoff_time: formData.lunch_skip_cutoff_time || '10:00:00',
      dinner_skip_cutoff_time: formData.dinner_skip_cutoff_time || '19:00:00',
      min_lead_days: Number(formData.min_lead_days) || 1,
      max_start_lead_days: Number(formData.max_start_lead_days) || 30,
      allow_undo_skip: Boolean(formData.allow_undo_skip),
      allow_skip_on_last_day: Boolean(formData.allow_skip_on_last_day),
      default_meal_thali_id: formData.default_meal_thali_id || null,
      sweet_food_item_id: formData.sweet_food_item_id || null,
      sweet_weekday_rule: formData.sweet_weekday_rule || 'first_delivery_of_week',
      contact_whatsapp_number: formData.contact_whatsapp_number || '+91 98765 43210',
    })
  }

  if (isLoading) {
    return <div className="h-96 rounded-xl bg-muted/60 animate-pulse" />
  }

  const thalis = (foodItems || []).filter((f) => f.kind === 'thali')
  const sweetsAndSingles = (foodItems || []).filter((f) => f.kind === 'single')

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-xl font-semibold">Global Subscription Settings</h2>
        <p className="text-sm text-muted-foreground">
          Operational cutoff policies, booking lead times, and complimentary rewards.
        </p>
      </div>

      {/* Centralized Holidays & Closures Note */}
      <Card className="border-amber-200/80 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
              <span>🗓️</span> Kitchen Holidays &amp; Multi-Day Closures
            </p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              Kitchen closures (single holidays, festivals, Diwali vacations) are centrally managed under <strong>Settings &gt; Holidays &amp; Closures</strong>. Adding holidays there disables website ordering AND automatically extends all active subscriber meal plans without penalty.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs shrink-0 border-amber-300 text-amber-900 bg-white hover:bg-amber-100"
            onClick={() => navigate('/settings?tab=holidays')}
          >
            Manage Holidays &rarr;
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skip Cutoff Times */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="size-4.5 text-primary" />
              Customer Skip Cutoffs (Same-Day)
            </CardTitle>
            <CardDescription className="text-xs">
              Enforced on the day of delivery in Asia/Kolkata timezone. Future dates can be skipped anytime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="lunch-cutoff">Lunch Skip Cutoff Time</Label>
              <Input
                id="lunch-cutoff"
                type="time"
                value={(formData.lunch_skip_cutoff_time || '10:00').slice(0, 5)}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, lunch_skip_cutoff_time: `${e.target.value}:00` }))
                }
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Cutoff on delivery day (e.g. 10:00 AM IST, matching your lunch order acceptance cutoff).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dinner-cutoff">Dinner Skip Cutoff Time</Label>
              <Input
                id="dinner-cutoff"
                type="time"
                value={(formData.dinner_skip_cutoff_time || '19:00').slice(0, 5)}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, dinner_skip_cutoff_time: `${e.target.value}:00` }))
                }
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Cutoff on delivery day (e.g. 07:00 PM IST, matching your dinner order acceptance cutoff).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Start Date Lead Times */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="size-4.5 text-primary" />
              Booking Lead Times
            </CardTitle>
            <CardDescription className="text-xs">
              Controls when customers can schedule their plan start date.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="min-lead">Minimum Lead Time (Days)</Label>
              <Input
                id="min-lead"
                type="number"
                min={0}
                max={7}
                value={formData.min_lead_days ?? 1}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, min_lead_days: parseInt(e.target.value) || 0 }))
                }
                required
              />
              <p className="text-[11px] text-muted-foreground">
                1 = Plan can start tomorrow at earliest; 0 = Today (subject to meal cutoff).
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="max-lead">Maximum Advance Booking (Days)</Label>
              <Input
                id="max-lead"
                type="number"
                min={7}
                max={90}
                value={formData.max_start_lead_days ?? 30}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, max_start_lead_days: parseInt(e.target.value) || 30 }))
                }
                required
              />
              <p className="text-[11px] text-muted-foreground">
                How many days ahead customer can pick their first meal date.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Skip Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Skip & Undo Policies</CardTitle>
            <CardDescription className="text-xs">
              Toggle flexibility options for subscribers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="undo-skip-toggle" className="text-sm font-medium">
                  Allow Undo of a Skip
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Subscribers can un-skip before the cutoff, removing the appended replacement day.
                </p>
              </div>
              <Switch
                id="undo-skip-toggle"
                checked={Boolean(formData.allow_undo_skip)}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, allow_undo_skip: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="last-day-skip-toggle" className="text-sm font-medium">
                  Allow Skip on Plan's Last Day
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  If off, customers cannot skip the final scheduled meal of their plan.
                </p>
              </div>
              <Switch
                id="last-day-skip-toggle"
                checked={Boolean(formData.allow_skip_on_last_day)}
                onCheckedChange={(checked) =>
                  setFormData((p) => ({ ...p, allow_skip_on_last_day: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Menu Items & WhatsApp */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="size-4.5 text-amber-500" />
              Menu Items & Contact Link
            </CardTitle>
            <CardDescription className="text-xs">
              Source items dynamically from your live kitchen catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="base-thali">Base Meal Catalog Item (Per-Day Pricing)</Label>
              <Select
                value={formData.default_meal_thali_id || ''}
                onValueChange={(val) => setFormData((p) => ({ ...p, default_meal_thali_id: val || null }))}
              >
                <SelectTrigger id="base-thali">
                  <SelectValue placeholder="Select standard Thali..." />
                </SelectTrigger>
                <SelectContent>
                  {thalis.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (MRP: ₹{item.compare_price || item.price}, Selling: ₹{item.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Updating this item's price in Food Items automatically adjusts quotes for new subscriptions.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sweet-item">Complimentary Sweet Menu Item</Label>
              <Select
                value={formData.sweet_food_item_id || ''}
                onValueChange={(val) => setFormData((p) => ({ ...p, sweet_food_item_id: val || null }))}
              >
                <SelectTrigger id="sweet-item">
                  <SelectValue placeholder="Select sweet from catalog..." />
                </SelectTrigger>
                <SelectContent>
                  {sweetsAndSingles.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (₹{item.price})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">Custom Plan Enquiry WhatsApp / Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  className="pl-9"
                  value={formData.contact_whatsapp_number || ''}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, contact_whatsapp_number: e.target.value }))
                  }
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
          <Save className="size-4" />
          {updateMutation.isPending ? 'Saving Settings...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  )
}
