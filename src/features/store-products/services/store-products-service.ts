import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'

export type StoreProduct = {
  id: string
  food_item_id: string
  category_id: string | null
  name: string
  name_gujarati?: string | null
  product_code?: string | null
  description?: string | null
  image_url?: string | null
  price: number
  compare_price?: number | null
  unit_label?: string | null
  is_available: boolean
  track_stock?: boolean
  stock_quantity?: number
  display_order?: number
  created_at?: string
  updated_at?: string
  categories?: Tables<'categories'> | null
}

export const STORE_PRODUCTS_CONFIG_KEY = 'store_products_catalog'
export const STORE_CATEGORY_SLUGS = ['farsan', 'sweets', 'snacks', 'beverages', 'add-ons']

/**
 * Checks whether a label represents a kitchen/dining portion (e.g. bowl, katori, plate).
 * Retail store products are packaged retail goods (gm, kg, pack, pcs) and must NEVER be sold or labeled in dining bowls.
 */
export function isDiningPortionUnit(label?: string | null): boolean {
  if (!label) return false
  const lower = label.trim().toLowerCase()
  return (
    lower.includes('bowl') ||
    lower.includes('katori') ||
    lower.includes('cup') ||
    lower.includes('plate') ||
    lower.includes('thali') ||
    lower.includes('portion')
  )
}

export function isStoreProductCategory(category: Tables<'categories'> | null): boolean {
  if (!category) return false
  const slug = (category.slug || '').toLowerCase()
  const type = (category.category_type || '').toLowerCase()
  return (
    type === 'snack' ||
    type === 'sweet' ||
    type === 'beverage' ||
    slug.includes('farsan') ||
    slug.includes('sweet') ||
    slug.includes('snack') ||
    slug.includes('nasta') ||
    slug.includes('beverage') ||
    slug.includes('add-on')
  )
}

/** Reads the decoupled store products registry from system_config */
export async function getStoreProductsCatalog(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', STORE_PRODUCTS_CONFIG_KEY)
    .maybeSingle()

  if (error) throw error

  if (data?.value && Array.isArray(data.value)) {
    return data.value as StoreProduct[]
  }

  // If not yet initialized in system_config, initialize from existing retail food items
  const { data: initialItems } = await supabase
    .from('food_items')
    .select('*, categories(*)')
    .eq('kind', 'single')
    .order('display_order', { ascending: true })

  const storeItems: StoreProduct[] = ((initialItems || []) as any[])
    .filter((item) => isStoreProductCategory(item.categories))
    .map((item) => ({
      id: item.id,
      food_item_id: item.id,
      category_id: item.category_id,
      name: item.name,
      name_gujarati: item.name_gujarati ?? null,
      description: item.description ?? null,
      image_url: item.image_url ?? null,
      price: item.price ?? 0,
      compare_price: item.compare_price ?? null,
      unit_label: isDiningPortionUnit(item.unit_label) ? null : (item.unit_label ?? null),
      is_available: item.is_available ?? true,
      track_stock: item.track_stock ?? false,
      stock_quantity: item.stock_quantity ?? 0,
      display_order: item.display_order ?? 0,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
    }))

  // Save the initialized catalog so it is persisted independently
  if (storeItems.length > 0) {
    try {
      await saveStoreProductsCatalog(storeItems)
    } catch {
      // If saving fails (e.g. read-only session), still return the in-memory items
    }
  }

  return storeItems
}

/** Saves the decoupled store products registry into system_config */
export async function saveStoreProductsCatalog(items: StoreProduct[]): Promise<void> {
  const { error } = await supabase
    .from('system_config')
    .upsert({
      key: STORE_PRODUCTS_CONFIG_KEY,
      value: items as any,
      description: '24/7 standalone store products catalog',
      is_public: true,
      updated_at: new Date().toISOString(),
    })

  if (error) throw error
}

/** Fetches all store products with categories joined and active pack variants resolved */
export async function fetchStoreProducts(): Promise<StoreProduct[]> {
  const [catalog, { data: categories }, { data: foodItems }, { data: variants }] = await Promise.all([
    getStoreProductsCatalog(),
    supabase.from('categories').select('*'),
    supabase.from('food_items').select('id, name, name_gujarati, description, image_url, unit_label'),
    supabase.from('food_item_variants').select('*').eq('is_active', true).order('display_order', { ascending: true }),
  ])

  const categoryMap = new Map((categories || []).map((c) => [c.id, c]))
  const foodItemMap = new Map((foodItems || []).map((f) => [f.id, f]))
  const variantsMap = new Map<string, any[]>()
  for (const v of variants || []) {
    const list = variantsMap.get(v.food_item_id) || []
    list.push(v)
    variantsMap.set(v.food_item_id, list)
  }

  return catalog.map((item) => {
    const freshDish = item.food_item_id ? foodItemMap.get(item.food_item_id) : null
    const dishVariants = variantsMap.get(item.food_item_id || item.id) || []
    const firstVariant = dishVariants[0]

    // Determine clean retail unit label (strictly reject dining portions like "1 Bowl")
    const rawUnit = item.unit_label ?? freshDish?.unit_label ?? null
    let cleanUnit: string | null = null
    if (rawUnit && !isDiningPortionUnit(rawUnit)) {
      cleanUnit = rawUnit
    } else if (dishVariants.length === 1) {
      cleanUnit = firstVariant.label
    }

    // Effective retail price: if standalone store price is 0 and variants exist, reflect variant starting price
    const effectivePrice =
      item.price && item.price > 0
        ? item.price
        : firstVariant
          ? firstVariant.price
          : item.price ?? 0

    const effectiveComparePrice =
      item.compare_price ?? firstVariant?.compare_price ?? null

    return {
      ...item,
      name: item.name || freshDish?.name || 'Unnamed Product',
      name_gujarati: item.name_gujarati ?? freshDish?.name_gujarati ?? null,
      product_code: item.product_code ?? (freshDish as any)?.product_code ?? null,
      description: item.description ?? freshDish?.description ?? null,
      image_url: item.image_url ?? freshDish?.image_url ?? null,
      price: effectivePrice,
      compare_price: effectiveComparePrice,
      unit_label: cleanUnit,
      categories: item.category_id ? categoryMap.get(item.category_id) || null : null,
    }
  })
}

/** Fetches all catalog food items so the admin can pick any dish as a template */
export async function fetchUnplacedFoodItems(): Promise<(Tables<'food_items'> & { categories: Tables<'categories'> | null })[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(*)')
    .eq('kind', 'single')
    .order('name', { ascending: true })

  if (error) throw error
  return (data as any) || []
}

/**
 * Toggle store-specific availability ("Selling" toggle).
 * Independent: DOES NOT touch food_items.is_available or Thalis!
 */
export async function toggleProductAvailability(
  id: string,
  is_available: boolean,
): Promise<StoreProduct> {
  const catalog = await getStoreProductsCatalog()
  const target = catalog.find((item) => item.id === id || item.food_item_id === id)
  if (!target) throw new Error('Product not found in store catalog')

  target.is_available = is_available
  target.updated_at = new Date().toISOString()

  await saveStoreProductsCatalog(catalog)
  return target
}

/**
 * Update store-specific pricing.
 * Independent: DOES NOT touch food_items.price!
 */
export async function updateProductPrice(
  id: string,
  price: number,
  compare_price: number | null,
): Promise<StoreProduct> {
  const catalog = await getStoreProductsCatalog()
  const target = catalog.find((item) => item.id === id || item.food_item_id === id)
  if (!target) throw new Error('Product not found in store catalog')

  target.price = price
  target.compare_price = compare_price
  target.updated_at = new Date().toISOString()

  await saveStoreProductsCatalog(catalog)
  return target
}

/**
 * Update store-specific product details.
 * Independent: DOES NOT mutate food_items table!
 */
export async function updateStoreProduct(
  id: string,
  input: Partial<StoreProduct>,
): Promise<StoreProduct> {
  const catalog = await getStoreProductsCatalog()
  const target = catalog.find((item) => item.id === id || item.food_item_id === id)
  if (!target) throw new Error('Product not found in store catalog')

  if (input.category_id !== undefined) target.category_id = input.category_id
  if (input.price !== undefined) target.price = input.price
  if (input.compare_price !== undefined) target.compare_price = input.compare_price
  if (input.unit_label !== undefined) {
    target.unit_label = isDiningPortionUnit(input.unit_label) ? null : (input.unit_label?.trim() || null)
  }
  if (input.is_available !== undefined) target.is_available = input.is_available
  if (input.track_stock !== undefined) target.track_stock = input.track_stock
  if (input.stock_quantity !== undefined) target.stock_quantity = input.stock_quantity
  if (input.display_order !== undefined) target.display_order = input.display_order
  target.updated_at = new Date().toISOString()

  await saveStoreProductsCatalog(catalog)
  return target
}

export type AddFoodItemToStoreInput = {
  foodItemId: string
  categoryId: string
  price: number
  comparePrice?: number | null
  unitLabel?: string | null
  trackStock?: boolean
  stockQuantity?: number
  isAvailable?: boolean
}

/**
 * Add a product to Store Products by picking a dish from Food Items.
 * Independent: Copies the dish info into store_products_catalog without modifying food_items!
 */
export async function addFoodItemToStore(
  input: AddFoodItemToStoreInput,
): Promise<StoreProduct> {
  const { data: foodItem, error } = await supabase
    .from('food_items')
    .select('*, categories(*)')
    .eq('id', input.foodItemId)
    .single()

  if (error || !foodItem) throw new Error('Food item not found in catalog')

  const catalog = await getStoreProductsCatalog()
  const existingIndex = catalog.findIndex((i) => i.food_item_id === input.foodItemId)

  const rawUnit = input.unitLabel?.trim() || foodItem.unit_label || null
  const cleanUnit = isDiningPortionUnit(rawUnit) ? null : rawUnit

  const newStoreItem: StoreProduct = {
    id: existingIndex >= 0 ? catalog[existingIndex].id : crypto.randomUUID(),
    food_item_id: foodItem.id,
    category_id: input.categoryId,
    name: foodItem.name,
    name_gujarati: foodItem.name_gujarati,
    description: foodItem.description,
    image_url: foodItem.image_url,
    price: input.price,
    compare_price: input.comparePrice ?? null,
    unit_label: cleanUnit,
    track_stock: input.trackStock ?? false,
    stock_quantity: input.trackStock ? (input.stockQuantity ?? 0) : 0,
    is_available: input.isAvailable ?? true,
    display_order: catalog.length + 1,
    created_at: existingIndex >= 0 ? catalog[existingIndex].created_at : new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    catalog[existingIndex] = newStoreItem
  } else {
    catalog.push(newStoreItem)
  }

  await saveStoreProductsCatalog(catalog)
  // Food items is NOT updated - dishes remain untouched in catalog & Thalis!
  return newStoreItem
}

/** Legacy alias pointing to addFoodItemToStore */
export async function placeItemInStoreCategory(
  foodItemId: string,
  targetCategoryId: string,
): Promise<StoreProduct> {
  const { data: foodItem } = await supabase
    .from('food_items')
    .select('*')
    .eq('id', foodItemId)
    .single()

  return addFoodItemToStore({
    foodItemId,
    categoryId: targetCategoryId,
    price: foodItem?.price ?? 0,
    comparePrice: foodItem?.compare_price ?? null,
    unitLabel: foodItem?.unit_label ?? null,
    isAvailable: true,
  })
}

/**
 * Removes a product from Store Products.
 * Independent: Only deletes from store_products_catalog!
 * Master food_items record is completely UNTOUCHED (retains category and is_available)!
 */
export async function removeProductFromStore(id: string): Promise<void> {
  const catalog = await getStoreProductsCatalog()
  const filtered = catalog.filter((item) => item.id !== id && item.food_item_id !== id)
  await saveStoreProductsCatalog(filtered)
}

export const deleteStoreProduct = removeProductFromStore
