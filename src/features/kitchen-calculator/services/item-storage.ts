import type { KitchenItemRecord, CalculatedItemResult, CalculatedMaterial } from '../types'

const STORAGE_KEY = 'foodiq_item_quantity_records'

/**
 * Loads all user-created items from localStorage.
 * Absolutely NO hard-coded records or test fallbacks.
 */
export function getStoredItems(): KitchenItemRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
    return []
  } catch (err) {
    console.error('Failed to read item records from storage:', err)
    return []
  }
}

/**
 * Saves a new or updated item to localStorage.
 */
export function saveItemRecord(item: KitchenItemRecord): KitchenItemRecord[] {
  const items = getStoredItems()
  const index = items.findIndex((i) => i.id === item.id)
  let updated: KitchenItemRecord[]
  if (index >= 0) {
    updated = [...items]
    updated[index] = {
      ...items[index],
      ...item,
      isPinned: item.isPinned ?? items[index].isPinned ?? false,
    }
  } else {
    updated = [item, ...items]
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to save item record:', err)
  }
  return updated
}

/**
 * Toggles the pinned status of an item.
 */
export function togglePinItem(id: string): KitchenItemRecord[] {
  const items = getStoredItems()
  const updated = items.map((item) =>
    item.id === id ? { ...item, isPinned: !item.isPinned } : item
  )
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to toggle pin item:', err)
  }
  return updated
}

/**
 * Deletes an item from localStorage.
 */
export function deleteItemRecord(id: string): KitchenItemRecord[] {
  const items = getStoredItems()
  const updated = items.filter((i) => i.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (err) {
    console.error('Failed to delete item record:', err)
  }
  return updated
}

/**
 * Calculates required material quantities for an item based on person count and extra quantity:
 * - Direct person calculation (for items like Dal, Sabji)
 * - Piece calculation (for items like Rotli, Bhakhari): (persons * defaultQty) + extraQuantity
 */
export function calculateItemQuantity(
  item: KitchenItemRecord,
  persons: number,
  extraQuantity: number = 0
): CalculatedItemResult {
  const count = Math.max(1, persons)
  const isPieceBased = Boolean(item.hasPieceCount && item.defaultPiecesPerPerson && item.defaultPiecesPerPerson > 0)
  const extra = Math.max(0, extraQuantity || 0)
  const defaultPieces = isPieceBased ? count * (item.defaultPiecesPerPerson || 1) : undefined
  const effectivePieces = isPieceBased && defaultPieces !== undefined
    ? defaultPieces + extra
    : undefined

  // Multiplier for materials: if piece-based, multiply by (persons * default + extra); otherwise by persons count
  const multiplier = isPieceBased && effectivePieces !== undefined ? effectivePieces : count

  // Find index of main material (explicit isMain flag, or default to first material)
  const mainIdx = item.materials.findIndex((m) => m.isMain)
  const effectiveMainIdx = mainIdx >= 0 ? mainIdx : 0

  const allMaterials: CalculatedMaterial[] = item.materials.map((m, idx) => {
    const total = Math.round(m.quantityPerPerson * multiplier * 100) / 100
    const isMain = idx === effectiveMainIdx

    let formattedTotal = `${total} ${m.unit}`
    if (m.unit.toLowerCase() === 'gm' && total >= 1000) {
      formattedTotal = `${(total / 1000).toFixed(2)} kg (${total} gm)`
    } else if (m.unit.toLowerCase() === 'ml' && total >= 1000) {
      formattedTotal = `${(total / 1000).toFixed(2)} L (${total} ml)`
    }

    return {
      id: m.id,
      name: m.name,
      quantityPerPerson: m.quantityPerPerson,
      totalQuantity: total,
      unit: m.unit,
      formattedTotal,
      isMain,
    }
  })

  const mainMaterial = allMaterials[effectiveMainIdx]
  const estimationMaterials = allMaterials.filter((_, idx) => idx !== effectiveMainIdx)

  return {
    itemId: item.id,
    itemName: item.name,
    persons: count,
    isPieceBased,
    defaultPieces,
    effectivePieces,
    extraPieces: extra,
    pieceUnit: item.pieceUnit || 'pcs',
    mainMaterial,
    estimationMaterials,
    allMaterials,
  }
}
