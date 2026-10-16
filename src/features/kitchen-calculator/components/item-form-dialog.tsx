import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Utensils, Sparkles } from 'lucide-react'
import type { KitchenItemRecord } from '../types'
import toast from 'react-hot-toast'

interface ItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemToEdit: KitchenItemRecord | null
  onSave: (item: KitchenItemRecord) => void
}

type EditableMaterial = {
  id: string
  name: string
  quantityPerPerson: number | string
  unit: string
  isMain?: boolean
}

export function ItemFormDialog({
  open,
  onOpenChange,
  itemToEdit,
  onSave,
}: ItemFormDialogProps) {
  const [name, setName] = useState('')
  const [hasPieceCount, setHasPieceCount] = useState(false)
  const [defaultPiecesPerPerson, setDefaultPiecesPerPerson] = useState<number | string>(5)
  const [pieceUnit, setPieceUnit] = useState('pcs')
  const [materials, setMaterials] = useState<EditableMaterial[]>([])

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name)
      setHasPieceCount(Boolean(itemToEdit.hasPieceCount))
      setDefaultPiecesPerPerson(itemToEdit.defaultPiecesPerPerson || 5)
      setPieceUnit(itemToEdit.pieceUnit || 'pcs')
      setMaterials(
        itemToEdit.materials && itemToEdit.materials.length > 0
          ? itemToEdit.materials.map((m, idx) => ({
              ...m,
              isMain: m.isMain !== undefined ? m.isMain : idx === 0,
            }))
          : [{ id: `mat-${Date.now()}`, name: '', quantityPerPerson: '', unit: 'gm', isMain: true }]
      )
    } else {
      setName('')
      setHasPieceCount(false)
      setDefaultPiecesPerPerson(5)
      setPieceUnit('pcs')
      setMaterials([{ id: `mat-${Date.now()}`, name: '', quantityPerPerson: '', unit: 'gm', isMain: true }])
    }
  }, [itemToEdit, open])

  const handleAddMaterial = () => {
    setMaterials((prev) => [
      ...prev,
      {
        id: `mat-${Date.now()}-${prev.length}`,
        name: '',
        quantityPerPerson: '',
        unit: 'gm',
        isMain: false,
      },
    ])
  }

  const handleRemoveMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  const handleUpdateMaterial = (id: string, field: keyof EditableMaterial, value: any) => {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) {
      toast.error('Item name is required (e.g. Bhakhari, Dal)')
      return
    }

    if (hasPieceCount && (Number(defaultPiecesPerPerson) <= 0 || isNaN(Number(defaultPiecesPerPerson)))) {
      toast.error('Please enter a valid default pieces per person (e.g. 5)')
      return
    }

    const validMaterials = materials.filter((m) => m.name.trim() !== '')
    if (validMaterials.length === 0) {
      toast.error('Please add at least one material')
      return
    }

    for (const m of validMaterials) {
      const q = Number(m.quantityPerPerson)
      if (isNaN(q) || q <= 0) {
        toast.error(`Please enter a valid quantity for "${m.name}"`)
        return
      }
    }

    const newItem: KitchenItemRecord = {
      id: itemToEdit ? itemToEdit.id : `item-${Date.now()}`,
      name: cleanName,
      isPinned: itemToEdit ? itemToEdit.isPinned : false,
      hasPieceCount: Boolean(hasPieceCount),
      defaultPiecesPerPerson: hasPieceCount ? Math.max(1, Number(defaultPiecesPerPerson) || 1) : undefined,
      pieceUnit: hasPieceCount ? (pieceUnit.trim() || 'pcs') : undefined,
      materials: validMaterials.map((m, idx) => ({
        id: m.id || `mat-${Date.now()}-${idx}`,
        name: m.name.trim(),
        quantityPerPerson: Number(m.quantityPerPerson),
        unit: m.unit.trim() || 'gm',
        isMain: idx === 0, // First material is always the main quantity
      })),
    }

    onSave(newItem)
    toast.success(itemToEdit ? 'Item updated' : 'Item created')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl p-5 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Utensils className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                {itemToEdit ? `Edit Item: ${itemToEdit.name}` : 'Add New Item Record'}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure quantity per person or piece-based items (like Rotli and Bhakhari) with material estimation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Item Name *</Label>
            <Input
              placeholder="e.g. Rotli, Bhakhari, Dal, Sabji"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 text-sm bg-background"
              required
            />
          </div>

          {/* Piece-Based Calculation Configuration */}
          <div className="rounded-xl border border-border p-3.5 bg-muted/30 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPieceCount}
                onChange={(e) => setHasPieceCount(e.target.checked)}
                className="mt-0.5 size-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">
                  Calculate by Pieces / Quantity (e.g. Rotli, Bhakhari, Puri)
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Enable if each person gets a fixed number of pieces (e.g. 5 rotlis per person) and you need to calculate extra pieces.
                </span>
              </div>
            </label>

            {hasPieceCount && (
              <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Default Quantity Per Person *</Label>
                  <Input
                    type="number"
                    min={1}
                    value={defaultPiecesPerPerson}
                    onChange={(e) => setDefaultPiecesPerPerson(e.target.value)}
                    placeholder="e.g. 5"
                    className="h-10 text-xs bg-background font-mono font-bold no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                  <span className="text-[10px] text-muted-foreground">
                    e.g. 5 pieces / person (16 persons = {Math.max(1, Number(defaultPiecesPerPerson) || 1) * 16} pieces)
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Unit Label</Label>
                  <Input
                    value={pieceUnit}
                    onChange={(e) => setPieceUnit(e.target.value)}
                    placeholder="pcs, rotli, bhakhari"
                    className="h-10 text-xs bg-background"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    e.g. pcs, rotli, bhakhari
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Materials Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <Label className="text-xs font-semibold block">
                  {hasPieceCount ? 'Materials Required (Per 1 Piece)' : 'Materials Required (Per 1 Person)'}
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {hasPieceCount
                    ? 'Enter raw material required to make 1 piece (e.g. 28 gm per rotli).'
                    : 'The first material is your main quantity; additional ones are for raw estimation.'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMaterial}
                className="h-8 text-xs gap-1 font-medium shrink-0"
              >
                <Plus className="size-3.5" /> Add Material
              </Button>
            </div>

            <div className="space-y-2.5">
              {materials.map((mat, index) => {
                const isMain = index === 0

                return (
                  <div
                    key={mat.id}
                    className={`p-3 rounded-xl border text-xs space-y-2 ${
                      isMain
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/40 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold flex items-center gap-1.5">
                        {isMain ? (
                          <span className="text-primary flex items-center gap-1">
                            <Sparkles className="size-3 text-primary" /> Main Quantity (Primary Material) *
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Estimation Material #{index + 1} (Optional)
                          </span>
                        )}
                      </span>

                      {!isMain && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMaterial(mat.id)}
                          className="size-7 text-destructive hover:bg-destructive/10 -mr-1 -mt-1"
                          title="Remove material"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <div className="flex-1 min-w-[140px]">
                        <Input
                          placeholder={isMain ? 'e.g. Atta (Main Flour)' : 'e.g. Cooking Oil, Ghee'}
                          value={mat.name}
                          onChange={(e) => handleUpdateMaterial(mat.id, 'name', e.target.value)}
                          className="h-10 text-xs bg-background"
                          required={isMain}
                        />
                      </div>

                      <div className="w-28">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          placeholder={hasPieceCount ? 'Qty / Piece' : 'Qty / Person'}
                          value={mat.quantityPerPerson}
                          onChange={(e) =>
                            handleUpdateMaterial(mat.id, 'quantityPerPerson', e.target.value)
                          }
                          className="h-10 text-xs bg-background font-mono font-bold no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          required={isMain}
                        />
                      </div>

                      <div className="w-24">
                        <select
                          value={mat.unit}
                          onChange={(e) => handleUpdateMaterial(mat.id, 'unit', e.target.value)}
                          className="w-full h-10 rounded-md border border-input bg-background px-2 text-xs font-medium focus-visible:outline-none"
                        >
                          <option value="gm">gm</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="ltr">ltr</option>
                          <option value="pc">pc</option>
                        </select>
                      </div>
                    </div>

                    {hasPieceCount && mat.quantityPerPerson && Number(mat.quantityPerPerson) > 0 && (
                      <div className="text-[10px] text-primary/80 font-mono font-medium">
                        (= {(Number(mat.quantityPerPerson) * (Number(defaultPiecesPerPerson) || 1)).toFixed(1)} {mat.unit} for {defaultPiecesPerPerson || 1} {pieceUnit || 'pcs'} / person)
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 min-w-20"
            >
              Cancel
            </Button>
            <Button type="submit" className="h-11 min-w-28 font-semibold">
              Save Item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
