import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useCreateItemCustomization,
  useDeleteItemCustomization,
  useItemCustomizations,
  useUpdateItemCustomization,
} from '@/features/food-items/hooks/use-item-customizations'
import { CURRENCY_SYMBOL } from '@/constants'

export function ItemCustomizationsManager({ foodItemId }: { foodItemId: string }) {
  const { data: customizations, isPending } = useItemCustomizations(foodItemId)
  const create = useCreateItemCustomization(foodItemId)
  const update = useUpdateItemCustomization(foodItemId)
  const remove = useDeleteItemCustomization(foodItemId)

  const [name, setName] = useState('')
  const [priceDelta, setPriceDelta] = useState('')

  const handleAdd = () => {
    const trimmedName = name.trim()
    const price = Number(priceDelta)
    if (!trimmedName || Number.isNaN(price)) return
    create.mutate(
      { name: trimmedName, price_delta: price, display_order: customizations?.length ?? 0 },
      {
        onSuccess: () => {
          setName('')
          setPriceDelta('')
        },
      },
    )
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">Add-ons</p>
        <p className="text-muted-foreground text-xs">
          Optional extras customers can add, each with its own price on top of the base price.
        </p>
      </div>

      {isPending ? (
        <Skeleton className="h-16 w-full" />
      ) : customizations?.length ? (
        <div className="space-y-2">
          {customizations.map((c) => (
            <div key={c.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
              <span className="min-w-0 flex-1 truncate text-sm">{c.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                +{CURRENCY_SYMBOL}
                {c.price_delta}
              </span>
              <Switch
                checked={c.is_active}
                onCheckedChange={(checked) => update.mutate({ id: c.id, input: { is_active: checked } })}
                aria-label={c.is_active ? 'Deactivate add-on' : 'Activate add-on'}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => remove.mutate(c.id)}
                aria-label="Delete add-on"
              >
                <Trash2 className="text-destructive size-3.5" aria-hidden />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">No add-ons yet.</p>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Input
            placeholder="e.g. Extra Roti"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="w-24 space-y-1">
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="Price"
            value={priceDelta}
            onChange={(e) => setPriceDelta(e.target.value)}
          />
        </div>
        <Button type="button" size="icon" onClick={handleAdd} disabled={create.isPending} aria-label="Add add-on">
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
