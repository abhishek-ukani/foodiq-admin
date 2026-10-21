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
 * Generates a canonical SCREAMING_SNAKE_CASE product code.
 * Example: generateProductCode('snack', 'Chakli Gujarati') -> "SNACK_CHAKLI_GUJARATI"
 */
export function generateProductCode(
  categoryTypeOrName?: string | null,
  itemName?: string | null,
): string {
  const cat = (categoryTypeOrName || 'ITEM')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6) || 'ITEM'
  const cleanName = (itemName || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('_')
  return `${cat}_${cleanName || 'DISH'}`.slice(0, 24)
}

/**
 * Generates a stable variant code from a product code, pack quantity, and unit.
 * Example: generateVariantCode('SNACK_CHAKLI', 500, 'gm') -> "SNACK_CHAKLI_500GM"
 */
export function generateVariantCode(
  productCode: string,
  quantity: number,
  unitType: string,
): string {
  const cleanPCode = (productCode || 'ITEM').toUpperCase().replace(/[^A-Z0-9_]/g, '')
  const unit = (unitType || 'GM').toUpperCase()
  return `${cleanPCode}_${quantity}${unit}`.slice(0, 32)
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
  variant_code?: string | null
  product_code?: string | null
}

/**
 * Creates a new product variant.
 */
export async function createFoodItemVariant(
  input: CreateFoodItemVariantInput,
): Promise<FoodItemVariant> {
  const { product_code: _product_code, ...variantData } = input
  const autoVariantCode = input.variant_code?.trim() || (
    input.product_code
      ? generateVariantCode(input.product_code, input.quantity, input.unit_type)
      : null
  )

  const payload: TablesInsert<'food_item_variants'> = {
    ...variantData,
    sku: input.sku?.trim() || generateVariantSku(input.food_item_id, input.label, input.unit_type),
    variant_code: autoVariantCode,
  }

  // If set as default, remove default flag from sibling variants first
  if (input.is_default) {
    try {
      await supabase
        .from('food_item_variants')
        .update({ is_default: false })
        .eq('food_item_id', input.food_item_id)
    } catch {
      // is_default column may not exist yet
    }
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

/**
 * Sets a specific variant as the default for its food item, unsetting others.
 */
export async function setDefaultVariant(foodItemId: string, variantId: string): Promise<void> {
  await supabase
    .from('food_item_variants')
    .update({ is_default: false })
    .eq('food_item_id', foodItemId)

  const { error } = await supabase
    .from('food_item_variants')
    .update({ is_default: true })
    .eq('id', variantId)

  if (error) throw error
}
