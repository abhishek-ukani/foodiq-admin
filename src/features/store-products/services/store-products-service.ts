import { supabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/types/database.types'

export type StoreProduct = Tables<'food_items'> & {
  categories: Tables<'categories'> | null
}

export const STORE_CATEGORY_SLUGS = ['farsan', 'sweets', 'snacks', 'beverages', 'add-ons']

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

/** Fetches all retail products sold all-time (Farsan, Sweets, Nasta, Beverages, Add-ons) */
export async function fetchStoreProducts(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(*)')
    .order('display_order', { ascending: true })

  if (error) throw error
  if (!data) return []

  // Filter to items belonging to retail/standalone store categories or configured for direct sale
  return (data as unknown as StoreProduct[]).filter((item) =>
    isStoreProductCategory(item.categories),
  )
}

/** Fetches all catalog food items so the admin can place any dish into store offerings */
export async function fetchUnplacedFoodItems(): Promise<StoreProduct[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(*)')
    .order('name', { ascending: true })

  if (error) throw error
  return (data as unknown as StoreProduct[]) || []
}

/** Toggle whether a product is enabled (active & visible for sale) or disabled */
export async function toggleProductAvailability(
  id: string,
  is_available: boolean,
): Promise<Tables<'food_items'>> {
  const { data, error } = await supabase
    .from('food_items')
    .update({ is_available })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Quick update for product price & optional strike-through compare price */
export async function updateProductPrice(
  id: string,
  price: number,
  compare_price: number | null,
): Promise<Tables<'food_items'>> {
  const { data, error } = await supabase
    .from('food_items')
    .update({ price, compare_price })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Update any field on a store product */
export async function updateStoreProduct(
  id: string,
  input: TablesUpdate<'food_items'>,
): Promise<Tables<'food_items'>> {
  const { data, error } = await supabase
    .from('food_items')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Add an existing food item from catalog into 24/7 store offerings with retail pricing & category */
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

export async function addFoodItemToStore(
  input: AddFoodItemToStoreInput,
): Promise<Tables<'food_items'>> {
  const updatePayload: TablesUpdate<'food_items'> = {
    category_id: input.categoryId,
    price: input.price,
    compare_price: input.comparePrice ?? null,
    unit_label: input.unitLabel?.trim() || null,
    track_stock: input.trackStock ?? false,
    stock_quantity: input.trackStock ? (input.stockQuantity ?? 0) : 0,
    is_available: input.isAvailable ?? true,
  }

  const { data, error } = await supabase
    .from('food_items')
    .update(updatePayload)
    .eq('id', input.foodItemId)
    .select('*, categories(*)')
    .single()

  if (error) throw error
  return data
}

/** Place an existing food item into a store product category (e.g. Farsan, Sweets, Snacks) */
export async function placeItemInStoreCategory(
  foodItemId: string,
  targetCategoryId: string,
): Promise<Tables<'food_items'>> {
  const { data, error } = await supabase
    .from('food_items')
    .update({ category_id: targetCategoryId, is_available: true })
    .eq('id', foodItemId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Safely removes a product from 24/7 store offerings without deleting the underlying food item
 * from the kitchen catalog. Sets category to null and marks it disabled.
 */
export async function removeProductFromStore(id: string): Promise<Tables<'food_items'>> {
  const { data, error } = await supabase
    .from('food_items')
    .update({
      category_id: null,
      is_available: false,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Legacy alias pointing to safe removal to prevent catastrophic deletion of catalog dishes */
export const deleteStoreProduct = removeProductFromStore
