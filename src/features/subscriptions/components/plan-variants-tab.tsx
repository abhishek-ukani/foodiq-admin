import { useState } from 'react'
import { Plus, Edit2, Trash2, Calendar, Sparkles, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { EmptyState } from '@/components/common/empty-state'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { PlanVariantFormDialog } from './plan-variant-form-dialog'
import { usePlanVariants, useDeletePlanVariant, useUpdatePlanVariant } from '../hooks/use-subscriptions'
import type { PlanVariantRow } from '@/types/database.types'

export function PlanVariantsTab() {
  const { data: variants, isLoading } = usePlanVariants()
  const deleteMutation = useDeletePlanVariant()
  const updateMutation = useUpdatePlanVariant()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<PlanVariantRow | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = () => {
    setSelectedVariant(null)
    setDialogOpen(true)
  }

  const handleEdit = (v: PlanVariantRow) => {
    setSelectedVariant(v)
    setDialogOpen(true)
  }

  const handleToggleActive = (v: PlanVariantRow) => {
    updateMutation.mutate({
      id: v.id,
      input: { is_active: !v.is_active },
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deletingId) return
    await deleteMutation.mutateAsync(deletingId)
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-xl bg-muted/60" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Subscription Plan Variants</h2>
          <p className="text-sm text-muted-foreground">
            Configure meal durations, weekday schedules, discount tiers, and complimentary sweet rewards.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 shrink-0">
          <Plus className="size-4" />
          Add Variant
        </Button>
      </div>

      {!variants || variants.length === 0 ? (
        <EmptyState
          title="No plan variants yet"
          description="Create your first subscription variant to offer customers meal plans."
          action={
            <Button size="sm" onClick={handleCreate}>
              Add Variant
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variants.map((variant) => (
            <Card
              key={variant.id}
              className={`relative overflow-hidden transition-all border-2 ${
                variant.is_active ? 'border-primary/20 bg-card' : 'border-border/60 bg-muted/30 opacity-75'
              }`}
            >
              {variant.badge_text && (
                <div className="absolute top-0 right-0">
                  <span className="inline-block rounded-bl-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-xs">
                    {variant.badge_text}
                  </span>
                </div>
              )}

              <CardHeader className="pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-display text-xl font-bold">{variant.name}</CardTitle>
                  <Badge variant={variant.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {variant.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-primary">🎯 {variant.who_it_is_for}</p>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {variant.short_description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                <div className="rounded-lg bg-muted/60 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Duration</span>
                    <p className="font-bold text-base text-foreground">
                      {variant.duration_meal_days} <span className="text-xs font-normal">Meal-Days</span>
                    </p>
                  </div>
                  <Badge variant="outline" className="font-bold text-sm bg-emerald-50 text-emerald-700 border-emerald-300">
                    {variant.discount_percentage}% OFF
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground/90">
                    <Calendar className="size-4 shrink-0 text-primary" />
                    <span>
                      {variant.schedule_type === 'every_other_day'
                        ? 'Alternate Days'
                        : `Days: ${(variant.delivery_days || []).join(', ')} (ISO)`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/90">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>{variant.skip_limit} skips allowed</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Sparkles className="size-4 shrink-0 text-emerald-600" />
                    <span>Complimentary snack included in every meal 🥟</span>
                  </div>
                  {variant.has_weekly_sweet ? (
                    <div className="flex items-center gap-2 text-amber-700 font-medium">
                      <Sparkles className="size-4 shrink-0 text-amber-500" />
                      <span>Weekly complimentary sweet included 🍬</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <XCircle className="size-4 shrink-0 text-muted-foreground/60" />
                      <span>No sweet reward</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(variant)}
                    className="text-xs"
                  >
                    {variant.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(variant)}
                      className="gap-1 text-xs"
                    >
                      <Edit2 className="size-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingId(variant.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs px-2"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanVariantFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        variant={selectedVariant}
      />

      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Plan Variant?"
        description="Are you sure you want to delete this variant? Any existing subscriptions will remain unaffected."
        confirmLabel="Delete"
        destructive={true}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
