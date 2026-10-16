export interface ItemMaterial {
  id: string
  name: string
  quantityPerPerson: number
  unit: string
  isMain?: boolean
}

export interface KitchenItemRecord {
  id: string
  name: string
  isPinned?: boolean
  hasPieceCount?: boolean
  defaultPiecesPerPerson?: number
  pieceUnit?: string
  materials: ItemMaterial[]
}

export interface CalculatedMaterial {
  id: string
  name: string
  quantityPerPerson: number
  totalQuantity: number
  unit: string
  formattedTotal: string
  isMain: boolean
}

export interface CalculatedItemResult {
  itemId: string
  itemName: string
  persons: number
  isPieceBased: boolean
  defaultPieces?: number
  effectivePieces?: number
  extraPieces?: number
  pieceUnit?: string
  mainMaterial?: CalculatedMaterial
  estimationMaterials: CalculatedMaterial[]
  allMaterials: CalculatedMaterial[]
}
