import { useState, useMemo } from 'react'
import {
  Calculator,
  Plus,
  Edit2,
  Trash2,
  Search,
  Pin,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { KitchenItemRecord } from '../types'
import {
  getStoredItems,
  saveItemRecord,
  deleteItemRecord,
  togglePinItem,
  calculateItemQuantity,
} from '../services/item-storage'
import { ItemFormDialog } from './item-form-dialog'
import toast from 'react-hot-toast'

export function KitchenCalculatorPage() {
  const [items, setItems] = useState<KitchenItemRecord[]>(() => getStoredItems())
  const [itemPersons, setItemPersons] = useState<Record<string, number>>({})
  const [itemExtraQty, setItemExtraQty] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<KitchenItemRecord | null>(null)

  const filteredAndSortedItems = useMemo(() => {
    let list = [...items]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.materials.some((m) => m.name.toLowerCase().includes(q))
      )
    }
    // Prioritize pinned items to the top
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return 0
    })
  }, [items, search])

  const handleSaveItem = (item: KitchenItemRecord) => {
    const updated = saveItemRecord(item)
    setItems(updated)
  }

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      const updated = deleteItemRecord(id)
      setItems(updated)
      toast.success(`Deleted "${name}"`)
    }
  }

  const handleTogglePin = (id: string, name: string, isPinned: boolean) => {
    const updated = togglePinItem(id)
    setItems(updated)
    if (!isPinned) {
      toast.success(`Pinned "${name}" to top`)
    } else {
      toast.success(`Unpinned "${name}"`)
    }
  }

  const getItemPersons = (itemId: string) => {
    return itemPersons[itemId] !== undefined ? itemPersons[itemId] : 16
  }

  const setItemPersonsCount = (itemId: string, count: number) => {
    setItemPersons((prev) => ({
      ...prev,
      [itemId]: Math.max(1, count),
    }))
  }

  const getItemExtraQty = (itemId: string) => {
    return itemExtraQty[itemId] !== undefined ? itemExtraQty[itemId] : 0
  }

  const setItemExtraQtyCount = (itemId: string, count: number) => {
    setItemExtraQty((prev) => ({
      ...prev,
      [itemId]: Math.max(0, count),
    }))
  }

  return (
    <div className="space-y-5 w-full max-w-7xl mx-auto pb-12">
      {/* Top Header with Always-Visible Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <Calculator className="size-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Item Quantity Calculator
            </h1>
            <p className="text-xs text-muted-foreground">
              Calculate required batch quantities for specific items.
            </p>
          </div>
        </div>

        {/* Search Bar & Add Item Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-8.5 pr-3 text-xs bg-background rounded-lg border-border shadow-xs"
            />
          </div>

          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}
            className="h-9 px-3.5 text-xs font-semibold gap-1.5 shadow-xs shrink-0 rounded-lg"
          >
            <Plus className="size-3.5" /> Add Item
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed p-8 text-center space-y-3 max-w-md mx-auto my-10 bg-card">
          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Plus className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-foreground">No item records yet</h3>
            <p className="text-xs text-muted-foreground">
              Add your first item (e.g. Rotli, Bhakhari, Dal) and configure quantity per person or piece calculation.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}
            className="h-9 px-4 text-xs font-semibold gap-1.5"
          >
            <Plus className="size-3.5" /> Add Item Record
          </Button>
        </div>
      ) : (
        /* Items Calculation Cards Grid (Fits 4 columns horizontally on desktop) */
        <div className="space-y-4">
          {filteredAndSortedItems.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground bg-card rounded-xl border">
              No items matching "{search}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredAndSortedItems.map((item) => {
                const currentPersons = getItemPersons(item.id)
                const extraQty = getItemExtraQty(item.id)
                const calculation = calculateItemQuantity(item, currentPersons, extraQty)

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'rounded-xl border bg-card p-3 space-y-2.5 shadow-xs transition-all flex flex-col justify-between',
                      item.isPinned
                        ? 'border-amber-400/60 bg-amber-500/[0.02] shadow-amber-500/5'
                        : 'hover:border-primary/40'
                    )}
                  >
                    {/* Card Header: Item Title + Pin + Edit + Delete */}
                    <div className="flex items-center justify-between gap-1.5 border-b pb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3
                          className="font-bold text-sm text-foreground truncate"
                          title={item.name}
                        >
                          {item.name}
                        </h3>
                        {item.isPinned && (
                          <span className="shrink-0 text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Pin className="size-2.5 fill-current" /> Pinned
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleTogglePin(item.id, item.name, !!item.isPinned)}
                          className={cn(
                            'size-7 rounded-md transition-colors',
                            item.isPinned
                              ? 'text-amber-600 bg-amber-500/15 hover:bg-amber-500/25'
                              : 'text-muted-foreground hover:text-foreground'
                          )}
                          title={item.isPinned ? 'Unpin item' : 'Pin to top'}
                        >
                          <Pin className={cn('size-3.5', item.isPinned && 'fill-current')} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(item)
                            setIsFormOpen(true)
                          }}
                          className="size-7 text-muted-foreground hover:text-foreground rounded-md"
                          title="Edit item"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="size-7 text-destructive hover:bg-destructive/10 rounded-md"
                          title="Delete item"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Steppers Area */}
                    <div className="space-y-2">
                      {/* Field 1: Persons Stepper */}
                      <div className="flex items-center justify-between gap-2 bg-muted/40 p-2 rounded-lg">
                        <span className="text-xs font-semibold text-muted-foreground pl-1">
                          Persons:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setItemPersonsCount(item.id, currentPersons - 1)}
                            className="size-8 sm:size-8.5 rounded-md bg-background border border-border flex items-center justify-center font-bold text-base hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                            title="Decrease persons"
                          >
                            -
                          </button>
                          <Input
                            type="number"
                            min={1}
                            value={currentPersons}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              setItemPersonsCount(item.id, Math.max(1, Number(e.target.value) || 1))
                            }
                            className="w-16 h-8 sm:h-8.5 text-center font-mono font-bold text-sm bg-background rounded-md border-border p-1 shadow-xs cursor-text focus:ring-2 focus:ring-primary/20 no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => setItemPersonsCount(item.id, currentPersons + 1)}
                            className="size-8 sm:size-8.5 rounded-md bg-background border border-border flex items-center justify-center font-bold text-base hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                            title="Increase persons"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Field 2: Extra Quantity Stepper (for Piece-Based items like Rotli & Bhakhari) */}
                      {item.hasPieceCount && (
                        <div className="flex items-center justify-between gap-2 bg-primary/[0.04] border border-primary/20 p-2 rounded-lg">
                          <span className="text-xs font-semibold text-foreground pl-1 truncate">
                            Quantity ({item.pieceUnit || 'pcs'}):
                          </span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setItemExtraQtyCount(item.id, extraQty - 1)
                              }
                              className="size-8 sm:size-8.5 rounded-md bg-background border border-border flex items-center justify-center font-bold text-base hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                              title="Decrease extra quantity"
                            >
                              -
                            </button>
                            <Input
                              type="number"
                              min={0}
                              value={extraQty}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                setItemExtraQtyCount(
                                  item.id,
                                  Math.max(0, Number(e.target.value) || 0)
                                )
                              }
                              className="w-16 h-8 sm:h-8.5 text-center font-mono font-bold text-sm bg-background rounded-md border-border p-1 shadow-xs cursor-text focus:ring-2 focus:ring-primary/20 no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setItemExtraQtyCount(item.id, extraQty + 1)
                              }
                              className="size-8 sm:size-8.5 rounded-md bg-background border border-border flex items-center justify-center font-bold text-base hover:bg-muted active:scale-95 transition-transform cursor-pointer"
                              title="Increase extra quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quantity Display (Zero raw materials shown on screen) */}
                    {calculation.mainMaterial ? (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 text-center space-y-0.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                          Total Quantity
                        </span>
                        <div className="text-lg sm:text-xl font-bold font-mono text-primary tracking-tight">
                          {calculation.mainMaterial.formattedTotal}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          {calculation.isPieceBased ? (
                            <span>
                              {calculation.effectivePieces} {calculation.pieceUnit} (
                              {extraQty > 0
                                ? `${currentPersons} × ${item.defaultPiecesPerPerson} + ${extraQty}`
                                : `${currentPersons} × ${item.defaultPiecesPerPerson}`}
                              )
                            </span>
                          ) : (
                            <span>
                              {calculation.mainMaterial.quantityPerPerson} {calculation.mainMaterial.unit} / person
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-2 text-xs text-muted-foreground">
                        No quantity configured
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Item Form Modal (Add / Edit) */}
      <ItemFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        itemToEdit={editingItem}
        onSave={handleSaveItem}
      />
    </div>
  )
}
