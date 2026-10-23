import type { Tables } from '@/types/database.types'
import type { AdminOrder } from '@/features/orders/services/orders-service'

export type ItemCategoryKind = 'meal' | 'farsan' | 'sweet' | 'sabji' | 'bread' | 'beverage' | 'accompaniment' | 'alacarte'

export interface ParsedItemComponent {
  name: string
  quantity?: number
  categoryType: 'bread' | 'sabji' | 'rice_dal' | 'farsan' | 'sweet' | 'accompaniment' | 'other'
}

export interface ParsedCustomizationAddon {
  name: string
  groupName?: string
  priceDelta: number
  quantity?: number
}

export interface ParsedOrderItem {
  id: string
  foodItemId: string | null
  itemName: string
  itemKind: string
  categoryKind: ItemCategoryKind
  variantName: string
  unitPrice: number
  quantity: number
  lineTotal: number
  specialInstructions: string | null
  components: ParsedItemComponent[]
  addons: ParsedCustomizationAddon[]
  baseBreadCount: number
  addonBreadCount: number
  totalBreadCount: number
  breadType: string // 'rotli' | 'bhakhri' | 'thepla' | 'puri' | 'bread'
}

/**
 * Classifies an individual dish or component string into a standard station category.
 */
export function classifyComponentType(rawName: string): ParsedItemComponent['categoryType'] {
  const name = rawName.toLowerCase()
  if (
    name.includes('rotli') ||
    name.includes('roti') ||
    name.includes('phulka') ||
    name.includes('bhakhri') ||
    name.includes('bhakhari') ||
    name.includes('puri') ||
    name.includes('thepla') ||
    name.includes('rotla') ||
    name.includes('paratha') ||
    name.includes('bread')
  ) {
    return 'bread'
  }

  if (
    name.includes('sabji') ||
    name.includes('shaak') ||
    name.includes('tameta') ||
    name.includes('tomato') ||
    name.includes('sev') ||
    name.includes('dudhi') ||
    name.includes('lauki') ||
    name.includes('ghiya') ||
    name.includes('chana') ||
    name.includes('bataka') ||
    name.includes('batata') ||
    name.includes('aloo') ||
    name.includes('paneer') ||
    name.includes('bhaji') ||
    name.includes('curry') ||
    name.includes('rasavala') ||
    name.includes('undhiyu') ||
    name.includes('ringna') ||
    name.includes('baingan') ||
    name.includes('karela') ||
    name.includes('tuver') ||
    name.includes('guvar') ||
    name.includes('parwal') ||
    name.includes('bhindi') ||
    name.includes('bhindu') ||
    name.includes('okra') ||
    name.includes('kobi') ||
    name.includes('cabbage') ||
    name.includes('flower') ||
    name.includes('cauliflower') ||
    name.includes('gobi') ||
    name.includes('methi') ||
    name.includes('palak') ||
    name.includes('tindora') ||
    name.includes('turiya') ||
    name.includes('turia') ||
    name.includes('tindli') ||
    name.includes('valor') ||
    name.includes('papdi') ||
    name.includes('chawli') ||
    name.includes('kathol') ||
    name.includes('mung') ||
    name.includes('mag') ||
    name.includes('rajma') ||
    name.includes('chole') ||
    name.includes('subji')
  ) {
    return 'sabji'
  }

  if (
    name.includes('dal') ||
    name.includes('kadhi') ||
    name.includes('rice') ||
    name.includes('bhat') ||
    name.includes('khichdi') ||
    name.includes('pulao') ||
    name.includes('biryani')
  ) {
    return 'rice_dal'
  }

  if (
    name.includes('dhokla') ||
    name.includes('khaman') ||
    name.includes('khandvi') ||
    name.includes('samosa') ||
    name.includes('patra') ||
    name.includes('kachori') ||
    name.includes('muthia') ||
    name.includes('farsan') ||
    name.includes('nasta') ||
    name.includes('snack') ||
    name.includes('chakli') ||
    name.includes('handvo') ||
    name.includes('fafda') ||
    name.includes('chewdo') ||
    name.includes('mamra') ||
    name.includes('gathiya')
  ) {
    return 'farsan'
  }

  if (
    name.includes('sweet') ||
    name.includes('mithai') ||
    name.includes('jamun') ||
    name.includes('shrikhand') ||
    name.includes('halwa') ||
    name.includes('mohanthal') ||
    name.includes('laddoo') ||
    name.includes('kheer') ||
    name.includes('basundi') ||
    name.includes('jalebi') ||
    name.includes('dessert') ||
    name.includes('gud') ||
    name.includes('jaggery')
  ) {
    return 'sweet'
  }

  if (
    name.includes('aachar') ||
    name.includes('achar') ||
    name.includes('pickle') ||
    name.includes('salad') ||
    name.includes('chutney') ||
    name.includes('papad') ||
    name.includes('sambharo') ||
    name.includes('mukhwas')
  ) {
    return 'accompaniment'
  }

  return 'other'
}

/**
 * Classifies an entire order item into high-level category kind.
 */
export function classifyItemCategory(itemName: string, itemKind: string): ItemCategoryKind {
  const n = itemName.toLowerCase()
  if (itemKind === 'thali' || n.includes('thali') || n.includes('tiffin') || n.includes('meal')) {
    return 'meal'
  }
  if (
    n.includes('nasta') ||
    n.includes('farsan') ||
    n.includes('khaman') ||
    n.includes('dhokla') ||
    n.includes('chakli') ||
    n.includes('handvo') ||
    n.includes('samosa') ||
    n.includes('snack')
  ) {
    return 'farsan'
  }
  if (
    n.includes('sweet') ||
    n.includes('mithai') ||
    n.includes('halwa') ||
    n.includes('jamun') ||
    n.includes('shrikhand') ||
    n.includes('mohanthal')
  ) {
    return 'sweet'
  }
  if (
    n.includes('chaas') ||
    n.includes('buttermilk') ||
    n.includes('drink') ||
    n.includes('lassi') ||
    n.includes('beverage')
  ) {
    return 'beverage'
  }
  if (n.includes('shaak') || n.includes('sabji') || n.includes('curry')) {
    return 'sabji'
  }
  if (n.includes('rotli') || n.includes('roti') || n.includes('bhakhri') || n.includes('bhakhari') || n.includes('thepla')) {
    return 'bread'
  }
  return 'alacarte'
}

/**
 * Detects the specific meal variant (e.g. Regular, Premium, Classic, Deluxe, Jain, etc.).
 */
export function detectMealVariant(item: Tables<'order_items'>): string {
  const variantSnap = item.variant_snapshot as { label?: string; name?: string } | null
  if (variantSnap?.label) return variantSnap.label
  if (variantSnap?.name) return variantSnap.name
  if (item.variant_code) return item.variant_code

  const n = item.item_name.toLowerCase()
  if (n.includes('regular')) return 'Regular'
  if (n.includes('premium')) return 'Premium'
  if (n.includes('classic')) return 'Classic'
  if (n.includes('deluxe')) return 'Deluxe'
  if (n.includes('swaminarayan')) return 'Swaminarayan'
  if (n.includes('jain')) return 'Jain'
  if (n.includes('mini')) return 'Mini'
  if (n.includes('executive')) return 'Executive'
  return 'Standard'
}

/**
 * Resolves standard pieces of bread per meal serving.
 * Thakar Rasoi / FoodIQ standards:
 * - Rotli / Phulka: 5 pcs per meal
 * - Bhakhari / Bhakhri: 2 pcs per meal (as specified in "5 Roti / 2 Bhakhri")
 * - Thepla: 4 pcs per meal
 * - Puri: 5 pcs per meal
 * - Rotla: 2 pcs per meal
 */
export function getBreadPiecesPerServing(breadType: string, explicitText?: string): number {
  if (explicitText) {
    // If text mentions both like "5 Roti / 2 Bhakhri" or "5 Roti / 2 Bhakhari"
    if (explicitText.includes('/') && (explicitText.toLowerCase().includes('bhakhri') || explicitText.toLowerCase().includes('bhakhari'))) {
      return breadType === 'bhakhri' || breadType === 'bhakhari' ? 2 : 5
    }
    // Check for explicit "5 pcs", "5 Rotli", "2 Bhakhri", "2 Bhakhari", "4 Thepla", etc.
    const match = explicitText.match(/(\d+)\s*(?:pcs|pc|rotli|roti|phulka|bhakhri|bhakhari|puri|thepla|rotla)?/i)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > 0 && num <= 20) return num
    }
  }

  switch (breadType) {
    case 'bhakhri':
    case 'bhakhari':
      return 2
    case 'thepla':
      return 4
    case 'puri':
      return 5
    case 'rotla':
      return 2
    case 'rotli':
    default:
      return 5
  }
}

/**
 * Extracts piece count for standalone bread items (e.g. "Rotli (5 pcs)" -> 5, "Extra Bhakhri" -> 1).
 */
export function getStandaloneBreadPieces(itemName: string): number {
  const match = itemName.match(/(\d+)\s*(?:pcs|pc|rotli|roti|phulka|bhakhri|bhakhari|puri|thepla|rotla)?/i)
  if (match) {
    const num = parseInt(match[1], 10)
    if (num > 0 && num <= 50) return num
  }
  return 1
}

/**
 * Parses snapshot JSON into a standardized list of item components.
 */
export function parseItemSnapshot(rawSnapshot: any): ParsedItemComponent[] {
  if (!rawSnapshot) return []
  if (Array.isArray(rawSnapshot)) {
    return rawSnapshot
      .map((item: any) => {
        if (typeof item === 'string') {
          return {
            name: item.trim(),
            quantity: 1,
            categoryType: classifyComponentType(item),
          }
        }
        if (item && typeof item === 'object') {
          const name = (item.name || item.label || item.item_name || '').trim()
          if (!name) return null
          const rawCat = (item.category || item.category_type || item.type || item.group_name || '').toLowerCase()
          let catType = classifyComponentType(name)
          if (rawCat.includes('sabji') || rawCat.includes('shaak') || rawCat.includes('curry')) {
            catType = 'sabji'
          } else if (rawCat.includes('bread') || rawCat.includes('roti') || rawCat.includes('bhakhri')) {
            catType = 'bread'
          } else if (rawCat.includes('dal') || rawCat.includes('rice')) {
            catType = 'rice_dal'
          } else if (rawCat.includes('sweet') || rawCat.includes('mithai')) {
            catType = 'sweet'
          } else if (rawCat.includes('farsan') || rawCat.includes('snack')) {
            catType = 'farsan'
          }

          return {
            name,
            quantity: Number(item.quantity || 1),
            categoryType: catType,
          }
        }
        return null
      })
      .filter(Boolean) as ParsedItemComponent[]
  }

  if (typeof rawSnapshot === 'object') {
    if (Array.isArray(rawSnapshot.items)) {
      return parseItemSnapshot(rawSnapshot.items)
    }
  }

  return []
}

/**
 * Parses customizations JSON into standardized add-ons.
 */
export function parseCustomizations(rawCustomizations: any): ParsedCustomizationAddon[] {
  if (!rawCustomizations) return []
  if (Array.isArray(rawCustomizations)) {
    return rawCustomizations
      .map((cust: any) => {
        if (typeof cust === 'string') {
          return {
            name: cust.trim(),
            priceDelta: 0,
          }
        }
        if (cust && typeof cust === 'object') {
          const name = (cust.name || cust.label || cust.option_name || '').trim()
          if (!name) return null
          const delta = Number(cust.price_delta ?? cust.priceDelta ?? 0)
          return {
            name,
            groupName: cust.group_name || cust.groupName,
            priceDelta: delta,
            quantity: Number(cust.quantity || 1),
          }
        }
        return null
      })
      .filter(Boolean) as ParsedCustomizationAddon[]
  }
  return []
}

/**
 * Parses an order item completely and calculates bread quantities and breakdowns.
 */
export function parseOrderItemDetails(item: Tables<'order_items'>): ParsedOrderItem {
  const categoryKind = classifyItemCategory(item.item_name, item.item_kind)
  const variantName = detectMealVariant(item)
  const components = parseItemSnapshot(item.item_snapshot)
  const rawAddons = parseCustomizations(item.customizations)

  // Separate true add-ons (extra charges or add-on groups) from choices
  const addons: ParsedCustomizationAddon[] = []
  rawAddons.forEach((a) => {
    const isAddonGroup = (a.groupName || '').toLowerCase().includes('add') || (a.groupName || '').toLowerCase().includes('extra')
    const isAddonName = a.name.toLowerCase().includes('extra') || a.priceDelta > 0
    if (isAddonGroup || isAddonName) {
      addons.push(a)
    } else {
      // If it's a choice (like bread choice: "Bhakhri" or sabji choice: "dudhi-dal"), also ensure it's in components
      if (!components.some((c) => c.name.toLowerCase() === a.name.toLowerCase())) {
        const gn = (a.groupName || '').toLowerCase()
        let catType = classifyComponentType(a.name)
        if (gn.includes('sabji') || gn.includes('shaak') || gn.includes('curry')) {
          catType = 'sabji'
        } else if (gn.includes('bread') || gn.includes('roti') || gn.includes('bhakhri') || gn.includes('bhakhari')) {
          catType = 'bread'
        } else if (gn.includes('dal') || gn.includes('rice')) {
          catType = 'rice_dal'
        } else if (gn.includes('sweet') || gn.includes('mithai')) {
          catType = 'sweet'
        } else if (gn.includes('farsan') || gn.includes('snack')) {
          catType = 'farsan'
        }

        components.push({
          name: a.name,
          quantity: 1,
          categoryType: catType,
        })
      }
    }
  })

  // Detect base bread type from meal choices/name ONLY (not from extra add-ons!)
  let breadType = ''
  const baseBreadNames = [
    item.item_name,
    ...components.filter((c) => c.categoryType === 'bread').map((c) => c.name),
  ].map((s) => s.toLowerCase())

  if (baseBreadNames.some((s) => s.includes('bhakhri') || s.includes('bhakhari'))) breadType = 'bhakhri'
  else if (baseBreadNames.some((s) => s.includes('thepla'))) breadType = 'thepla'
  else if (baseBreadNames.some((s) => s.includes('puri'))) breadType = 'puri'
  else if (baseBreadNames.some((s) => s.includes('rotla'))) breadType = 'rotla'
  else if (baseBreadNames.some((s) => s.includes('rotli') || s.includes('roti') || s.includes('phulka'))) breadType = 'rotli'

  // Calculate Base Bread count strictly from real items/choices
  let baseBreadPerMeal = 0
  let baseBreadCount = 0

  if (categoryKind === 'meal') {
    const breadComp = components.find((c) => c.categoryType === 'bread')
    if (breadComp || breadType) {
      const isBhakhri =
        breadType === 'bhakhri' ||
        (breadComp && (breadComp.name.toLowerCase().includes('bhakhri') || breadComp.name.toLowerCase().includes('bhakhari')))
      const effectiveType = breadType || (isBhakhri ? 'bhakhri' : 'rotli')
      baseBreadPerMeal = getBreadPiecesPerServing(effectiveType, breadComp?.name || item.item_name)
      baseBreadCount = baseBreadPerMeal * (item.quantity || 1)

      if (breadComp) {
        breadComp.quantity = baseBreadPerMeal
      } else {
        components.unshift({
          name: isBhakhri ? 'Bhakhari' : 'Rotli',
          quantity: baseBreadPerMeal,
          categoryType: 'bread',
        })
      }
    }
  } else if (
    categoryKind === 'bread' ||
    item.item_name.toLowerCase().includes('rotli') ||
    item.item_name.toLowerCase().includes('roti') ||
    item.item_name.toLowerCase().includes('bhakhri') ||
    item.item_name.toLowerCase().includes('bhakhari') ||
    item.item_name.toLowerCase().includes('thepla') ||
    item.item_name.toLowerCase().includes('puri')
  ) {
    const piecesPerItem = getStandaloneBreadPieces(item.item_name)
    baseBreadCount = piecesPerItem * (item.quantity || 1)
  }

  // Calculate Addon Bread count
  let addonBreadCount = 0
  addons.forEach((addon) => {
    const n = addon.name.toLowerCase()
    if (
      n.includes('rotli') ||
      n.includes('roti') ||
      n.includes('phulka') ||
      n.includes('bhakhri') ||
      n.includes('bhakhari') ||
      n.includes('thepla') ||
      n.includes('puri') ||
      n.includes('rotla')
    ) {
      const match = n.match(/(\d+)\s*(?:pcs|pc|rotli|roti|phulka|bhakhri|bhakhari|thepla|puri|rotla)?/i)
      const count = match ? parseInt(match[1], 10) : ((n.includes('bhakhri') || n.includes('bhakhari')) ? 1 : 2)
      addonBreadCount += count * (item.quantity || 1)
    }
  })

  return {
    id: item.id,
    foodItemId: item.food_item_id,
    itemName: item.item_name,
    itemKind: item.item_kind,
    categoryKind,
    variantName,
    unitPrice: Number(item.unit_price || 0),
    quantity: item.quantity || 1,
    lineTotal: Number(item.line_total || 0),
    specialInstructions: item.special_instructions,
    components,
    addons,
    baseBreadCount,
    addonBreadCount,
    totalBreadCount: baseBreadCount + addonBreadCount,
    breadType,
  }
}

export interface KitchenFoodItemProduction {
  id?: string
  name: string
  categoryType: 'bread' | 'sabji' | 'rice_dal' | 'farsan' | 'sweet' | 'accompaniment' | 'beverage' | 'other'
  baseCount: number
  addonCount: number
  totalCount: number
  unit: string
}

export interface KitchenProductionSheet {
  totalOrders: number
  totalMeals: number
  totalRegularThalis: number
  totalPremiumThalis: number
  totalClassicThalis: number
  totalDeluxeThalis: number
  totalOtherMeals: number
  mealsWithDalRice: number
  foodItems: Record<string, KitchenFoodItemProduction>
  breads: {
    rotli: { base: number; addOn: number; total: number }
    bhakhri: { base: number; addOn: number; total: number }
    thepla: { base: number; addOn: number; total: number }
    puri: { base: number; addOn: number; total: number }
    rotla: { base: number; addOn: number; total: number }
    totalAllBreads: number
  }
  sabjis: Record<
    string,
    {
      name: string
      basePortions: number
      addonPortions: number
      totalPortions: number
    }
  >
  totalSabjiPortions: number
  dalKadhiRice: Record<string, { name: string; portions: number }>
  salads: {
    totalPortions: number
    items: Record<string, { name: string; count: number }>
  }
  snacksFarsan: Record<string, { name: string; count: number; unit?: string }>
  sweets: Record<string, { name: string; count: number }>
  beverages: Record<string, { name: string; count: number }>
  packaging: {
    regular5CpTrays: number
    premium8CpTrays: number
    singleContainers: number
    totalPackages: number
  }
  specialInstructionsList: {
    orderNumber: string
    customerName: string
    instruction: string
  }[]
}

/**
 * Aggregates all orders into a single Kitchen Production Sheet (Cook & Bake count).
 * Directly links with food items: no artificial mapping or loss of ordered items.
 */
export function calculateKitchenProduction(orders: AdminOrder[]): KitchenProductionSheet {
  let totalMeals = 0
  let totalRegularThalis = 0
  let totalPremiumThalis = 0
  let totalClassicThalis = 0
  let totalDeluxeThalis = 0
  let totalOtherMeals = 0

  const foodItemsMap: Record<string, KitchenFoodItemProduction> = {}

  const addFoodItem = (
    rawName: string,
    quantity: number,
    isAddon: boolean,
    categoryType: KitchenFoodItemProduction['categoryType'],
    defaultUnit?: string,
  ) => {
    const trimmed = rawName.trim()
    const key = trimmed.toLowerCase()
    if (!key) return

    const unit =
      defaultUnit ||
      (categoryType === 'bread'
        ? 'pcs'
        : categoryType === 'rice_dal'
          ? 'bowls'
          : categoryType === 'sabji' || categoryType === 'accompaniment'
            ? 'por.'
            : 'pcs')

    if (!foodItemsMap[key]) {
      foodItemsMap[key] = {
        name: trimmed,
        categoryType,
        baseCount: 0,
        addonCount: 0,
        totalCount: 0,
        unit,
      }
    }

    if (isAddon) {
      foodItemsMap[key].addonCount += quantity
    } else {
      foodItemsMap[key].baseCount += quantity
    }
    foodItemsMap[key].totalCount += quantity
  }

  const breads = {
    rotli: { base: 0, addOn: 0, total: 0 },
    bhakhri: { base: 0, addOn: 0, total: 0 },
    thepla: { base: 0, addOn: 0, total: 0 },
    puri: { base: 0, addOn: 0, total: 0 },
    rotla: { base: 0, addOn: 0, total: 0 },
    totalAllBreads: 0,
  }

  const sabjisMap: Record<
    string,
    {
      name: string
      basePortions: number
      addonPortions: number
      totalPortions: number
    }
  > = {}

  const dalKadhiRiceMap: Record<string, { name: string; portions: number }> = {}
  const saladsMap: Record<string, { name: string; count: number }> = {}
  const snacksFarsanMap: Record<string, { name: string; count: number; unit?: string }> = {}
  const sweetsMap: Record<string, { name: string; count: number }> = {}
  const beveragesMap: Record<string, { name: string; count: number }> = {}

  const packaging = {
    regular5CpTrays: 0,
    premium8CpTrays: 0,
    singleContainers: 0,
    totalPackages: 0,
  }

  const specialInstructionsList: {
    orderNumber: string
    customerName: string
    instruction: string
  }[] = []

  orders.forEach((order) => {
    if (order.special_instructions?.trim()) {
      specialInstructionsList.push({
        orderNumber: order.order_number,
        customerName: order.contact_name || 'Customer',
        instruction: order.special_instructions.trim(),
      })
    }

    const items = order.order_items || []
    items.forEach((rawItem) => {
      const parsed = parseOrderItemDetails(rawItem)

      if (parsed.specialInstructions?.trim()) {
        specialInstructionsList.push({
          orderNumber: order.order_number,
          customerName: order.contact_name || 'Customer',
          instruction: `${parsed.itemName}: ${parsed.specialInstructions.trim()}`,
        })
      }

      // Meal & Thali counting
      if (parsed.categoryKind === 'meal') {
        totalMeals += parsed.quantity
        if (parsed.variantName === 'Regular') {
          totalRegularThalis += parsed.quantity
          packaging.regular5CpTrays += parsed.quantity
        } else if (parsed.variantName === 'Premium') {
          totalPremiumThalis += parsed.quantity
          packaging.premium8CpTrays += parsed.quantity
        } else if (parsed.variantName === 'Classic') {
          totalClassicThalis += parsed.quantity
          packaging.regular5CpTrays += parsed.quantity
        } else if (parsed.variantName === 'Deluxe') {
          totalDeluxeThalis += parsed.quantity
          packaging.premium8CpTrays += parsed.quantity
        } else {
          totalOtherMeals += parsed.quantity
          packaging.regular5CpTrays += parsed.quantity
        }

        // Add base breads for meals (only if base breads actually exist)
        if (parsed.baseBreadCount > 0) {
          const breadCompName = parsed.components.find((c) => c.categoryType === 'bread')?.name
          if (parsed.breadType === 'bhakhri' || parsed.breadType === 'bhakhari') {
            breads.bhakhri.base += parsed.baseBreadCount
            addFoodItem(breadCompName || 'Bhakhari', parsed.baseBreadCount, false, 'bread', 'pcs')
          } else if (parsed.breadType === 'thepla') {
            breads.thepla.base += parsed.baseBreadCount
            addFoodItem(breadCompName || 'Thepla', parsed.baseBreadCount, false, 'bread', 'pcs')
          } else if (parsed.breadType === 'puri') {
            breads.puri.base += parsed.baseBreadCount
            addFoodItem(breadCompName || 'Puri', parsed.baseBreadCount, false, 'bread', 'pcs')
          } else if (parsed.breadType === 'rotla') {
            breads.rotla.base += parsed.baseBreadCount
            addFoodItem(breadCompName || 'Bajri no Rotlo', parsed.baseBreadCount, false, 'bread', 'pcs')
          } else {
            breads.rotli.base += parsed.baseBreadCount
            addFoodItem(breadCompName || 'Rotli', parsed.baseBreadCount, false, 'bread', 'pcs')
          }
        }
      } else {
        packaging.singleContainers += parsed.quantity

        // Standalone bread item counting
        if (parsed.categoryKind === 'bread' || parsed.baseBreadCount > 0) {
          if (parsed.breadType === 'bhakhri' || parsed.breadType === 'bhakhari') {
            breads.bhakhri.addOn += parsed.baseBreadCount
            addFoodItem(parsed.itemName || 'Bhakhari', parsed.baseBreadCount, true, 'bread', 'pcs')
          } else if (parsed.breadType === 'thepla') {
            breads.thepla.addOn += parsed.baseBreadCount
            addFoodItem(parsed.itemName || 'Thepla', parsed.baseBreadCount, true, 'bread', 'pcs')
          } else if (parsed.breadType === 'puri') {
            breads.puri.addOn += parsed.baseBreadCount
            addFoodItem(parsed.itemName || 'Puri', parsed.baseBreadCount, true, 'bread', 'pcs')
          } else if (parsed.breadType === 'rotla') {
            breads.rotla.addOn += parsed.baseBreadCount
            addFoodItem(parsed.itemName || 'Bajri no Rotlo', parsed.baseBreadCount, true, 'bread', 'pcs')
          } else {
            breads.rotli.addOn += parsed.baseBreadCount
            addFoodItem(parsed.itemName || 'Rotli', parsed.baseBreadCount, true, 'bread', 'pcs')
          }
        }
      }

      // Add-on breads from meal customizations (attribute each addon to its own bread station!)
      parsed.addons.forEach((addon) => {
        const aName = addon.name.toLowerCase()
        const match = aName.match(/(\d+)\s*(?:pcs|pc|rotli|roti|phulka|bhakhri|bhakhari|thepla|puri|rotla)?/i)
        if (aName.includes('bhakhri') || aName.includes('bhakhari')) {
          const count = match ? parseInt(match[1], 10) : 1
          const totalQty = count * parsed.quantity
          breads.bhakhri.addOn += totalQty
          addFoodItem('Bhakhari', totalQty, true, 'bread', 'pcs')
        } else if (aName.includes('thepla')) {
          const count = match ? parseInt(match[1], 10) : 2
          const totalQty = count * parsed.quantity
          breads.thepla.addOn += totalQty
          addFoodItem('Thepla', totalQty, true, 'bread', 'pcs')
        } else if (aName.includes('puri')) {
          const count = match ? parseInt(match[1], 10) : 4
          const totalQty = count * parsed.quantity
          breads.puri.addOn += totalQty
          addFoodItem('Puri', totalQty, true, 'bread', 'pcs')
        } else if (aName.includes('rotla')) {
          const count = match ? parseInt(match[1], 10) : 1
          const totalQty = count * parsed.quantity
          breads.rotla.addOn += totalQty
          addFoodItem('Bajri no Rotlo', totalQty, true, 'bread', 'pcs')
        } else if (aName.includes('rotli') || aName.includes('roti') || aName.includes('phulka')) {
          const count = match ? parseInt(match[1], 10) : 2
          const totalQty = count * parsed.quantity
          breads.rotli.addOn += totalQty
          addFoodItem('Rotli', totalQty, true, 'bread', 'pcs')
        }
      })

      // Process components
      parsed.components.forEach((comp) => {
        const cName = comp.name.trim()
        if (!cName) return
        if (comp.categoryType === 'bread') return // Already handled above with piece counts!

        const qty = (comp.quantity || 1) * parsed.quantity

        if (comp.categoryType === 'sabji') {
          const key = cName.toLowerCase()
          if (!sabjisMap[key]) {
            sabjisMap[key] = { name: cName, basePortions: 0, addonPortions: 0, totalPortions: 0 }
          }
          sabjisMap[key].basePortions += qty
          sabjisMap[key].totalPortions += qty
          addFoodItem(cName, qty, false, 'sabji', 'por.')
        } else if (comp.categoryType === 'rice_dal') {
          const key = cName.toLowerCase()
          if (!dalKadhiRiceMap[key]) {
            dalKadhiRiceMap[key] = { name: cName, portions: 0 }
          }
          dalKadhiRiceMap[key].portions += qty
          addFoodItem(cName, qty, false, 'rice_dal', 'bowls')
        } else if (comp.categoryType === 'farsan') {
          const key = cName.toLowerCase()
          if (!snacksFarsanMap[key]) {
            snacksFarsanMap[key] = { name: cName, count: 0 }
          }
          snacksFarsanMap[key].count += qty
          addFoodItem(cName, qty, false, 'farsan', 'pcs')
        } else if (comp.categoryType === 'sweet') {
          const key = cName.toLowerCase()
          if (!sweetsMap[key]) {
            sweetsMap[key] = { name: cName, count: 0 }
          }
          sweetsMap[key].count += qty
          addFoodItem(cName, qty, false, 'sweet', 'pcs')
        } else if (comp.categoryType === 'accompaniment') {
          const key = cName.toLowerCase()
          if (!saladsMap[key]) {
            saladsMap[key] = { name: cName, count: 0 }
          }
          saladsMap[key].count += qty
          addFoodItem(cName, qty, false, 'accompaniment', 'por.')
        } else {
          addFoodItem(cName, qty, false, 'other', 'pcs')
        }
      })

      // Standalone non-meal items (e.g. Khaman 250g, Chaas bottle, Extra Sabji)
      if (parsed.categoryKind === 'farsan') {
        const key = parsed.itemName.toLowerCase()
        if (!snacksFarsanMap[key]) {
          snacksFarsanMap[key] = { name: parsed.itemName, count: 0 }
        }
        snacksFarsanMap[key].count += parsed.quantity
        addFoodItem(parsed.itemName, parsed.quantity, false, 'farsan', 'pcs')
      } else if (parsed.categoryKind === 'sweet') {
        const key = parsed.itemName.toLowerCase()
        if (!sweetsMap[key]) {
          sweetsMap[key] = { name: parsed.itemName, count: 0 }
        }
        sweetsMap[key].count += parsed.quantity
        addFoodItem(parsed.itemName, parsed.quantity, false, 'sweet', 'pcs')
      } else if (parsed.categoryKind === 'beverage') {
        const key = parsed.itemName.toLowerCase()
        if (!beveragesMap[key]) {
          beveragesMap[key] = { name: parsed.itemName, count: 0 }
        }
        beveragesMap[key].count += parsed.quantity
        addFoodItem(parsed.itemName, parsed.quantity, false, 'beverage', 'por.')
      } else if (parsed.categoryKind === 'sabji') {
        const key = parsed.itemName.toLowerCase()
        if (!sabjisMap[key]) {
          sabjisMap[key] = { name: parsed.itemName, basePortions: 0, addonPortions: 0, totalPortions: 0 }
        }
        sabjisMap[key].basePortions += parsed.quantity
        sabjisMap[key].totalPortions += parsed.quantity
        addFoodItem(parsed.itemName, parsed.quantity, false, 'sabji', 'por.')
      } else if (parsed.categoryKind === 'accompaniment') {
        const key = parsed.itemName.toLowerCase()
        if (!saladsMap[key]) {
          saladsMap[key] = { name: parsed.itemName, count: 0 }
        }
        saladsMap[key].count += parsed.quantity
        addFoodItem(parsed.itemName, parsed.quantity, false, 'accompaniment', 'por.')
      }

      // Process Add-ons (e.g., Extra Sabji)
      parsed.addons.forEach((addon) => {
        const aName = addon.name.trim()
        const aLower = aName.toLowerCase()
        if (aLower.includes('sabji') || aLower.includes('shaak') || aLower.includes('curry')) {
          const cleanName = aName.replace(/^extra\s+/i, '').trim() || 'Extra Sabji'
          const key = cleanName.toLowerCase()
          if (!sabjisMap[key]) {
            sabjisMap[key] = { name: cleanName, basePortions: 0, addonPortions: 0, totalPortions: 0 }
          }
          const addQty = (addon.quantity || 1) * parsed.quantity
          sabjisMap[key].addonPortions += addQty
          sabjisMap[key].totalPortions += addQty
          addFoodItem(cleanName, addQty, true, 'sabji', 'por.')
        }
      })
    })
  })

  // Final bread totals
  breads.rotli.total = breads.rotli.base + breads.rotli.addOn
  breads.bhakhri.total = breads.bhakhri.base + breads.bhakhri.addOn
  breads.thepla.total = breads.thepla.base + breads.thepla.addOn
  breads.puri.total = breads.puri.base + breads.puri.addOn
  breads.rotla.total = breads.rotla.base + breads.rotla.addOn
  breads.totalAllBreads =
    breads.rotli.total +
    breads.bhakhri.total +
    breads.thepla.total +
    breads.puri.total +
    breads.rotla.total

  let totalSabjiPortions = 0
  Object.values(sabjisMap).forEach((s) => {
    totalSabjiPortions += s.totalPortions
  })

  // Count meals that actually include Dal or Rice in their components
  let mealsWithDalRice = 0
  orders.forEach((order) => {
    (order.order_items || []).forEach((rawItem) => {
      const parsed = parseOrderItemDetails(rawItem)
      if (parsed.categoryKind === 'meal' && parsed.components.some((c) => c.categoryType === 'rice_dal')) {
        mealsWithDalRice += parsed.quantity
      }
    })
  })

  let totalSaladPortions = 0
  Object.values(saladsMap).forEach((s) => {
    totalSaladPortions += s.count
  })

  packaging.totalPackages = packaging.regular5CpTrays + packaging.premium8CpTrays + packaging.singleContainers

  return {
    totalOrders: orders.length,
    totalMeals,
    totalRegularThalis,
    totalPremiumThalis,
    totalClassicThalis,
    totalDeluxeThalis,
    totalOtherMeals,
    mealsWithDalRice,
    foodItems: foodItemsMap,
    breads,
    sabjis: sabjisMap,
    totalSabjiPortions,
    dalKadhiRice: dalKadhiRiceMap,
    salads: {
      totalPortions: totalSaladPortions,
      items: saladsMap,
    },
    snacksFarsan: snacksFarsanMap,
    sweets: sweetsMap,
    beverages: beveragesMap,
    packaging,
    specialInstructionsList,
  }
}

/**
 * Formats a clean text summary of kitchen production for sharing via WhatsApp.
 */
export function formatKitchenProductionWhatsAppText(sheet: KitchenProductionSheet, title = 'FOODIQ KITCHEN PREP SHEET'): string {
  const lines: string[] = []
  lines.push(`👨‍🍳 *${title.toUpperCase()}*`)
  lines.push(`📅 Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} | Orders: ${sheet.totalOrders}`)
  const variantParts: string[] = []
  if (sheet.totalRegularThalis > 0) variantParts.push(`${sheet.totalRegularThalis} Regular`)
  if (sheet.totalClassicThalis > 0) variantParts.push(`${sheet.totalClassicThalis} Classic`)
  if (sheet.totalPremiumThalis > 0) variantParts.push(`${sheet.totalPremiumThalis} Premium`)
  if (sheet.totalDeluxeThalis > 0) variantParts.push(`${sheet.totalDeluxeThalis} Deluxe`)
  if (sheet.totalOtherMeals > 0) variantParts.push(`${sheet.totalOtherMeals} Other`)
  const mealVariantBreakdown = variantParts.join(', ')

  lines.push(`🍱 *Total Meals / Thalis:* ${sheet.totalMeals}${mealVariantBreakdown ? ` (${mealVariantBreakdown})` : ''}`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)

  // Breads / Roti
  if (sheet.breads.totalAllBreads > 0) {
    lines.push(`🍞 *TAWA & BREADS TO BAKE:*`)
    if (sheet.breads.rotli.total > 0) {
      lines.push(`• *Rotli / Phulka:* ${sheet.breads.rotli.total} pcs (${sheet.breads.rotli.base} Base + ${sheet.breads.rotli.addOn} Extra Addons)`)
    }
    if (sheet.breads.bhakhri.total > 0) {
      lines.push(`• *Bhakhri:* ${sheet.breads.bhakhri.total} pcs (${sheet.breads.bhakhri.base} Base + ${sheet.breads.bhakhri.addOn} Extra)`)
    }
    if (sheet.breads.thepla.total > 0) {
      lines.push(`• *Thepla:* ${sheet.breads.thepla.total} pcs`)
    }
    if (sheet.breads.puri.total > 0) {
      lines.push(`• *Puri:* ${sheet.breads.puri.total} pcs`)
    }
    lines.push(`👉 *Total Breads:* ${sheet.breads.totalAllBreads} pcs`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  }

  // Sabjis
  const sabjiList = Object.values(sheet.sabjis)
  if (sabjiList.length > 0) {
    lines.push(`🍲 *SHAAK / SABJIS TO COOK:*`)
    sabjiList.forEach((s) => {
      const addonNote = s.addonPortions > 0 ? ` (incl. ${s.addonPortions} extra)` : ''
      lines.push(`• ${s.name}: *${s.totalPortions} portions*${addonNote}`)
    })
    lines.push(`👉 *Total Curry Portions:* ${sheet.totalSabjiPortions}`)
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  }

  // Dal / Rice
  const dalList = Object.values(sheet.dalKadhiRice)
  if (dalList.length > 0) {
    lines.push(`🍚 *DAL, KADHI & RICE:*`)
    dalList.forEach((d) => {
      lines.push(`• ${d.name}: *${d.portions} portions*`)
    })
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  }

  // Salads & Accompaniments
  const saladList = Object.values(sheet.salads.items)
  if (saladList.length > 0) {
    lines.push(`🥗 *SALAD & ACCOMPANIMENTS:*`)
    saladList.forEach((sal) => {
      lines.push(`• ${sal.name}: *${sal.count} portions*`)
    })
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  }

  // Snacks & Farsan
  const farsanList = Object.values(sheet.snacksFarsan)
  if (farsanList.length > 0) {
    lines.push(`🥟 *FARSAN & NASTA:*`)
    farsanList.forEach((f) => {
      lines.push(`• ${f.name}: *${f.count}*`)
    })
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  }

  // Sweets & Drinks
  const sweetList = Object.values(sheet.sweets)
  const bevList = Object.values(sheet.beverages)
  if (sweetList.length > 0 || bevList.length > 0) {
    lines.push(`🍬 *SWEETS & DRINKS:*`)
    sweetList.forEach((sw) => lines.push(`• ${sw.name}: *${sw.count} pcs*`))
    bevList.forEach((bv) => lines.push(`• ${bv.name}: *${bv.count}*`))
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  }

  // Packaging
  lines.push(`📦 *PACKAGING BOXES REQUIRED:*`)
  if (sheet.packaging.regular5CpTrays > 0) lines.push(`• Regular 5-CP Trays: ${sheet.packaging.regular5CpTrays}`)
  if (sheet.packaging.premium8CpTrays > 0) lines.push(`• Premium 8-CP Trays: ${sheet.packaging.premium8CpTrays}`)
  if (sheet.packaging.singleContainers > 0) lines.push(`• Single Pack Containers: ${sheet.packaging.singleContainers}`)
  lines.push(`👉 Total Packaging Units: ${sheet.packaging.totalPackages}`)

  if (sheet.specialInstructionsList.length > 0) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━`)
    lines.push(`⚠️ *SPECIAL KITCHEN INSTRUCTIONS (${sheet.specialInstructionsList.length}):*`)
    sheet.specialInstructionsList.forEach((item, idx) => {
      lines.push(`${idx + 1}. [${item.orderNumber}] ${item.customerName}: "${item.instruction}"`)
    })
  }

  return lines.join('\n')
}
