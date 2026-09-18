import { supabase } from '@/lib/supabase'
import type { Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type FoodItemVariant = Tables<'food_item_variants'>

/**
 * Fetches all variants for a specific food item ordered by display_order, then price.
 */
export async function fetchFoodItemVariants(
  foodItemId: string,
): Promise<FoodItemVariant[]> {
  const { data, error } = await supabase
    .from('food_item_variants')
    .select('*')
    .eq('food_item_id', foodItemId)
    .order('display_order', { ascending: true })
    .order('price', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetches all variants across all food items (useful for indexing or batch badges).
 */
export async function fetchAllFoodItemVariants(): Promise<FoodItemVariant[]> {
  const { data, error } = await supabase
    .from('food_item_variants')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Helper to generate a standardized SKU if one isn't explicitly provided.
 */
export function generateVariantSku(
  foodItemId: string,
  label: string,
  unitType: string,
): string {
  const cleanLabel = label.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const shortId = foodItemId.slice(0, 6).toUpperCase()
  return `SKU-${shortId}-${cleanLabel || unitType.toUpperCase()}`
}

export type CreateFoodItemVariantInput = Omit<
  TablesInsert<'food_item_variants'>,
  'sku'
> & {
  sku?: string
}

/**
 * Creates a new product variant.
 */
export async function createFoodItemVariant(
  input: CreateFoodItemVariantInput,
): Promise<FoodItemVariant> {
  const payload = {
    ...input,
    sku: input.sku?.trim() || generateVariantSku(input.food_item_id, input.label, input.unit_type),
  }

  const { data, error } = await supabase
    .from('food_item_variants')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Updates an existing product variant.
 */
export async function updateFoodItemVariant(
  id: string,
  input: TablesUpdate<'food_item_variants'>,
): Promise<FoodItemVariant> {
  const { data, error } = await supabase
    .from('food_item_variants')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Quick toggle to enable / disable a variant.
 */
export async function toggleVariantActive(
  id: string,
  isActive: boolean,
): Promise<FoodItemVariant> {
  return updateFoodItemVariant(id, { is_active: isActive })
}

/**
 * Deletes a variant by ID.
 */
export async function deleteFoodItemVariant(id: string): Promise<void> {
  const { error } = await supabase
    .from('food_item_variants')
    .delete()
    .eq('id', id)

  if (error) throw error
}
