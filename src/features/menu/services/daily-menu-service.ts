import { supabase } from '@/lib/supabase'
import { getDefaultBranchId } from '@/lib/default-branch'
import type { MealType, Tables } from '@/types/database.types'

export type DailyMenuItemWithFood = Tables<'daily_menu_items'> & {
  food_items: Tables<'food_items'>
}

export interface DailyMenuBundle {
  menu: Tables<'daily_menus'>
  items: DailyMenuItemWithFood[]
}

export async function autoPopulateDailyMenuWithActiveItems(dailyMenuId: string): Promise<number> {
  const { data: existing } = await supabase
    .from('daily_menu_items')
    .select('id')
    .eq('daily_menu_id', dailyMenuId)

  if (existing && existing.length > 0) {
    return 0 // Already has items
  }

  // Fetch active food items and filter ONLY Thalis (e.g. 4 Thali packages)
  const { data: foodItems } = await supabase
    .from('food_items')
    .select('*, categories(category_type)')
    .eq('is_available', true)
    .order('display_order')

  if (!foodItems || foodItems.length === 0) return 0

  const thaliItems = foodItems.filter((item) => {
    const catType = (item.categories as any)?.category_type
    return (
      item.kind === 'composite' ||
      catType === 'thali' ||
      item.name.toLowerCase().includes('thali')
    )
  })

  if (thaliItems.length === 0) return 0

  const itemsToInsert = thaliItems.map((item) => ({
    daily_menu_id: dailyMenuId,
    food_item_id: item.id,
    is_available: true,
    is_special: false,
    is_standalone_sale: true,
    is_thali_option: true,
    display_order: item.display_order ?? 0,
  }))

  const { error } = await supabase.from('daily_menu_items').insert(itemsToInsert)
  if (error) throw error
  return itemsToInsert.length
}

/** Gets today's menu row for (date, meal), creating an unpublished one if it doesn't exist yet, and populating active items by default. */
export async function ensureDailyMenu(menuDate: string, mealType: MealType): Promise<Tables<'daily_menus'>> {
  const branch_id = await getDefaultBranchId()

  const { data: existing, error: fetchError } = await supabase
    .from('daily_menus')
    .select('*')
    .eq('branch_id', branch_id)
    .eq('menu_date', menuDate)
    .eq('meal_type', mealType)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (existing) {
    return existing
  }

  const { data: created, error: insertError } = await supabase
    .from('daily_menus')
    .insert({ branch_id, menu_date: menuDate, meal_type: mealType, is_published: false })
    .select()
    .single()
  if (insertError) throw insertError

  await autoPopulateDailyMenuWithActiveItems(created.id)
  return created
}

export async function fetchMenuItems(dailyMenuId: string): Promise<DailyMenuItemWithFood[]> {
  const { data, error } = await supabase
    .from('daily_menu_items')
    .select('*, food_items(*)')
    .eq('daily_menu_id', dailyMenuId)
    .order('display_order')
  if (error) throw error
  return data as unknown as DailyMenuItemWithFood[]
}

export async function setMenuPublished(id: string, is_published: boolean): Promise<void> {
  const { error } = await supabase.from('daily_menus').update({ is_published }).eq('id', id)
  if (error) throw error
}

export async function updateMenuCutoffTime(id: string, cutoff_time: string | null): Promise<void> {
  const { error } = await supabase.from('daily_menus').update({ cutoff_time }).eq('id', id)
  if (error) throw error
}

export async function addItemToMenu(
  dailyMenuId: string,
  foodItemId: string,
  options?: { is_standalone_sale?: boolean; is_thali_option?: boolean },
): Promise<void> {
  const { data: existing } = await supabase
    .from('daily_menu_items')
    .select('id, is_standalone_sale, is_thali_option')
    .eq('daily_menu_id', dailyMenuId)
    .eq('food_item_id', foodItemId)
    .maybeSingle()

  if (existing) {
    const updatePayload: Record<string, any> = {}
    if (options?.is_standalone_sale !== undefined) updatePayload.is_standalone_sale = options.is_standalone_sale
    if (options?.is_thali_option !== undefined) updatePayload.is_thali_option = options.is_thali_option

    const { error } = await supabase.from('daily_menu_items').update(updatePayload).eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('daily_menu_items')
    .insert({
      daily_menu_id: dailyMenuId,
      food_item_id: foodItemId,
      is_standalone_sale: options?.is_standalone_sale ?? true,
      is_thali_option: options?.is_thali_option ?? true,
    })
  if (error) throw error
}

export async function removeItemFromMenu(id: string): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').delete().eq('id', id)
  if (error) throw error
}

export async function toggleMenuItemSpecial(id: string, is_special: boolean): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').update({ is_special }).eq('id', id)
  if (error) throw error
}

export async function toggleMenuItemAvailable(id: string, is_available: boolean): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').update({ is_available }).eq('id', id)
  if (error) throw error
}

export async function toggleMenuItemStandalone(id: string, is_standalone_sale: boolean): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').update({ is_standalone_sale }).eq('id', id)
  if (error) throw error
}

export async function toggleMenuItemThaliOption(id: string, is_thali_option: boolean): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').update({ is_thali_option }).eq('id', id)
  if (error) throw error
}

export async function updateMenuItemCutoff(
  id: string,
  cutoff_time: string | null,
  cutoff_note: string | null,
): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').update({ cutoff_time, cutoff_note }).eq('id', id)
  if (error) throw error
}

/** Update quantity cap and/or per-item cutoff time for a menu item. */
export async function updateMenuItemInventory(
  id: string,
  data: { available_quantity: number | null; cutoff_time: string | null },
): Promise<void> {
  const { error } = await supabase.from('daily_menu_items').update(data).eq('id', id)
  if (error) throw error
}

/** Increment sold_quantity for a menu item (used when admin creates an order). */
export async function incrementMenuItemSoldQty(
  foodItemId: string,
  deliveryDate: string,
  qty: number,
): Promise<void> {
  // Find the daily_menu_items row for this food item on the delivery date
  const { data: menuRow } = await supabase
    .from('daily_menu_items')
    .select('id, sold_quantity, daily_menus!inner(menu_date)')
    .eq('food_item_id', foodItemId)
    .eq('daily_menus.menu_date', deliveryDate)
    .maybeSingle()

  if (menuRow) {
    await supabase
      .from('daily_menu_items')
      .update({ sold_quantity: (menuRow.sold_quantity ?? 0) + qty })
      .eq('id', menuRow.id)
  }
}

/** Decrement sold_quantity for all items in an order (used when order is cancelled/rejected). */
export async function decrementOrderItemsSoldQty(orderId: string): Promise<void> {
  // Fetch order items to know what to decrement
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('food_item_id, quantity, orders!inner(delivery_date)')
    .eq('order_id', orderId)

  if (!orderItems?.length) return

  for (const oi of orderItems) {
    const deliveryDate = (oi.orders as any)?.delivery_date as string | undefined
    if (!deliveryDate) continue

    const { data: menuRow } = await supabase
      .from('daily_menu_items')
      .select('id, sold_quantity, daily_menus!inner(menu_date)')
      .eq('food_item_id', oi.food_item_id)
      .eq('daily_menus.menu_date', deliveryDate)
      .maybeSingle()

    if (menuRow && (menuRow.sold_quantity ?? 0) > 0) {
      await supabase
        .from('daily_menu_items')
        .update({ sold_quantity: Math.max(0, (menuRow.sold_quantity ?? 0) - oi.quantity) })
        .eq('id', menuRow.id)
    }
  }
}

export async function copyPreviousMenu(
  sourceDate: string,
  targetMenuId: string,
  mealType: MealType,
): Promise<number> {
  const branch_id = await getDefaultBranchId()

  // 1. Find the source menu
  const { data: sourceMenu } = await supabase
    .from('daily_menus')
    .select('id')
    .eq('branch_id', branch_id)
    .eq('menu_date', sourceDate)
    .eq('meal_type', mealType)
    .maybeSingle()

  if (!sourceMenu) throw new Error(`No menu found for ${sourceDate}`)

  // 2. Fetch items from source menu
  const { data: sourceItems } = await supabase
    .from('daily_menu_items')
    .select('food_item_id, is_special, display_order')
    .eq('daily_menu_id', sourceMenu.id)

  if (!sourceItems || sourceItems.length === 0) {
    throw new Error(`The menu for ${sourceDate} has no items to copy`)
  }

  // 3. Fetch existing items in target menu to avoid duplicates
  const { data: existingItems } = await supabase
    .from('daily_menu_items')
    .select('food_item_id')
    .eq('daily_menu_id', targetMenuId)

  const existingFoodItemIds = new Set((existingItems || []).map((i) => i.food_item_id))

  const newItemsToInsert = sourceItems
    .filter((i) => !existingFoodItemIds.has(i.food_item_id))
    .map((i) => ({
      daily_menu_id: targetMenuId,
      food_item_id: i.food_item_id,
      is_special: i.is_special,
      display_order: i.display_order,
    }))

  if (newItemsToInsert.length > 0) {
    const { error } = await supabase.from('daily_menu_items').insert(newItemsToInsert)
    if (error) throw error
  }

  return newItemsToInsert.length
}

