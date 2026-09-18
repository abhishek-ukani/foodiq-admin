import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Scale, UtensilsCrossed } from 'lucide-react'
import { ItemVariantsManager } from '@/features/food-items/components/item-variants-manager'

export type VariantTargetProduct = {
  id: string
  name: string
  name_gujarati?: string | null
  image_url?: string | null
  price?: number
  categories?: { name: string } | null
}

export function ProductVariantsDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: VariantTargetProduct | null
}) {
  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="size-12 rounded-xl object-cover border shrink-0"
              />
            ) : (
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <UtensilsCrossed className="size-6" />
              </div>
            )}
            <div>
              <DialogTitle className="text-lg sm:text-xl font-display flex items-center gap-2">
                <Scale className="size-5 text-primary shrink-0" />
                <span>{product.name} — Variants</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {product.name_gujarati && (
                  <span className="font-gujarati mr-2">{product.name_gujarati}</span>
                )}
                {product.categories?.name && (
                  <Badge variant="secondary" className="text-[10px] mr-2">
                    {product.categories.name}
                  </Badge>
                )}
                Base Price: ₹{product.price ?? 0}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="pt-2">
          <ItemVariantsManager
            foodItemId={product.id}
            defaultPrice={product.price}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
