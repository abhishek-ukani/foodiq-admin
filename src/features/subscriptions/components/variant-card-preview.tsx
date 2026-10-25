import { Check, Sparkles, Calendar, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { PlanVariantRow } from '@/types/database.types'

type VariantCardPreviewProps = {
  variant: Partial<PlanVariantRow>
}

export function VariantCardPreview({ variant }: VariantCardPreviewProps) {
  const name = variant.name || 'Plan Name'
  const badgeText = variant.badge_text
  const whoItIsFor = variant.who_it_is_for || 'Who it is for description'
  const shortDesc = variant.short_description || 'Short plan description'
  const duration = variant.duration_meal_days || 15
  const discount = variant.discount_percentage || 0
  const skips = variant.skip_limit ?? 2
  const hasSweet = variant.has_weekly_sweet ?? false
  const scheduleType = variant.schedule_type || 'weekdays_selection'
  const days = variant.delivery_days || [1, 2, 3, 4, 5]

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const activeDaysStr =
    scheduleType === 'every_other_day'
      ? 'Alternate Days (Every 2nd day)'
      : days.map((d) => dayNames[d - 1]).join(', ')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>Customer Card Live Preview</span>
        <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          Mobile & Web Look
        </span>
      </div>

      <Card className="relative overflow-hidden border-2 border-primary/20 bg-card transition-all shadow-sm">
        {badgeText && (
          <div className="absolute top-0 right-0">
            <span className="inline-block rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs">
              {badgeText}
            </span>
          </div>
        )}

        <CardHeader className="pt-5 pb-3">
          <div className="space-y-1">
            <CardTitle className="font-display text-xl text-foreground font-bold">
              {name}
            </CardTitle>
            <p className="text-xs font-medium text-primary flex items-center gap-1">
              <span>🎯</span> {whoItIsFor}
            </p>
          </div>
          <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {shortDesc}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Validity Duration</p>
              <p className="font-bold text-base text-foreground">
                {duration} <span className="text-xs font-normal">Meal-Days</span>
              </p>
            </div>
            {discount > 0 && (
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                {discount}% OFF
              </Badge>
            )}
          </div>

          <ul className="space-y-2 text-xs text-foreground/90">
            <li className="flex items-start gap-2">
              <Calendar className="size-4 shrink-0 text-primary mt-0.5" />
              <span>
                <strong>Schedule:</strong> {activeDaysStr}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>
                Up to <strong>{skips} delivery skips</strong> allowed (extends your plan)
              </span>
            </li>
            <li className="flex items-start gap-2 text-emerald-700 font-medium">
              <Sparkles className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>Complimentary add-ons included in every meal (Salad &amp; Pickle)</span>
            </li>
            {hasSweet ? (
              <li className="flex items-start gap-2 text-amber-700 font-medium">
                <Sparkles className="size-4 shrink-0 text-amber-500 mt-0.5" />
                <span>Weekly complimentary homemade sweet included 🍬</span>
              </li>
            ) : (
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="size-4 flex items-center justify-center text-[11px]">•</span>
                <span>Standard meals (no sweet reward)</span>
              </li>
            )}
          </ul>

          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>Renew reminder: when ≤ {variant.renewal_reminder_threshold || 3} meals left</span>
            <Badge variant="outline" className="text-[10px]">
              {variant.is_active !== false ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-xs text-amber-800 dark:text-amber-300">
        <ShieldAlert className="size-4 shrink-0 mt-0.5" />
        <p>
          <strong>Notice:</strong> Changes to discounts, duration, or schedule apply to <u>new subscriptions only</u>. Active subscribers retain their original purchased terms.
        </p>
      </div>
    </div>
  )
}
