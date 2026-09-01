import { supabase } from '@/lib/supabase'
import { getDefaultBranchId } from '@/lib/default-branch'
import { incrementMenuItemSoldQty, decrementOrderItemsSoldQty } from '@/features/menu/services/daily-menu-service'
import type { ItemKind, OrderStatus, PaymentMethod, PaymentStatus, Tables, TablesInsert, TablesUpdate } from '@/types/database.types'

export type AdminOrder = Tables<'orders'> & { order_items: Tables<'order_items'>[] }

export type AdminOrderItemInput = {
  food_item_id: string
  item_name: string
  item_kind: ItemKind
  item_image_url?: string | null
  unit_price: number
  quantity: number
  customizations?: any[]
  customization_total?: number
  line_total: number
  special_instructions?: string | null
}

export type CreateAdminOrderInput = {
  userId: string
  contactName?: string | null
  contactPhone?: string | null
  addressId?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  landmark?: string | null
  city?: string | null
  state?: string | null
  pincode?: string | null
  saveNewAddress?: boolean
  addressLabel?: 'home' | 'work' | 'other'
  deliveryDate: string
  deliverySlotId?: string | null
  deliverySlotLabel?: string | null
  paymentMethod?: PaymentMethod | null
  paymentStatus?: PaymentStatus | null
  paymentReference?: string | null
  orderStatus: OrderStatus
  subtotal: number
  deliveryCharge: number
  discountAmount: number
  taxAmount: number
  totalAmount: number
  specialInstructions?: string | null
  items: AdminOrderItemInput[]
}

export type FoodItemForOrder = Tables<'food_items'> & {
  categories: Pick<Tables<'categories'>, 'id' | 'name'> | null
  item_customizations: Tables<'item_customizations'>[]
  thali_option_groups: (Tables<'thali_option_groups'> & {
    thali_option_items: Tables<'thali_option_items'>[]
  })[]
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('placed_at', { ascending: false })
  if (error) throw error
  return data as unknown as AdminOrder[]
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reason?: string,
): Promise<void> {
  const patch: TablesUpdate<'orders'> = { status }
  if (status === 'rejected') patch.rejection_reason = reason ?? null
  if (status === 'cancelled') patch.cancellation_reason = reason ?? null

  const { error } = await supabase.from('orders').update(patch).eq('id', id)
  if (error) throw error

  // Release inventory when order is cancelled or rejected
  if (status === 'cancelled' || status === 'rejected') {
    await decrementOrderItemsSoldQty(id).catch(() => {/* non-critical */})
  }
}

export async function fetchActiveDeliverySlots(): Promise<Tables<'delivery_slots'>[]> {
  const { data, error } = await supabase
    .from('delivery_slots')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchFoodItemsForOrder(): Promise<FoodItemForOrder[]> {
  const { data, error } = await supabase
    .from('food_items')
    .select('*, categories(id, name), item_customizations(*), thali_option_groups(*, thali_option_items(*))')
    .eq('is_available', true)
    .order('name', { ascending: true })
  if (error) throw error
  return data as unknown as FoodItemForOrder[]
}

export type ResolvedAdminOptionItem = {
  id: string
  label: string
  price_delta: number
  is_default: boolean
  is_available: boolean
  linked_food_item_id?: string | null
}

export type ResolvedAdminOptionGroup = {
  id: string
  name: string
  is_required: boolean
  options: ResolvedAdminOptionItem[]
}

/**
 * Dynamically resolves Thali option groups for the admin "Place Order" dialog.
 * Merges statically-configured thali_option_items with today's daily_menu_items
 * so the admin sees the same Sabji / Bread / Sweet choices as customers on the web.
 */
export async function fetchThaliOptionGroupsForAdminOrder(
  foodItemId: string,
  deliveryDate: string,
): Promise<ResolvedAdminOptionGroup[]> {
  // 1. Fetch the structural option groups (with their manually-set static items)
  const { data: groups, error: groupErr } = await supabase
    .from('thali_option_groups')
    .select('*, thali_option_items(*, food_items:linked_food_item_id(id, name, is_available))')
    .eq('food_item_id', foodItemId)
    .eq('is_active', true)
    .order('display_order')

  if (groupErr || !groups || groups.length === 0) return []

  // 2. Resolve the active meal type for the delivery date
  const { data: publishedMenus } = await supabase
    .from('daily_menus')
    .select('meal_type, cutoff_time')
    .eq('menu_date', deliveryDate)
    .eq('is_published', true)

  let mealType = 'lunch'
  if (publishedMenus && publishedMenus.length > 0) {
    const nowStr = new Date().toTimeString().substring(0, 5)
    const openMenu = publishedMenus.find((m) => !m.cutoff_time || nowStr < m.cutoff_time.substring(0, 5))
    mealType = openMenu ? openMenu.meal_type : publishedMenus[0].meal_type
  }

  // 3. Fetch daily menu items for the target date/meal (same logic as web's thali-customizer-service)
  const { data: dailyItems } = await supabase
    .from('daily_menu_items')
    .select('*, food_items(*, categories(id, name, category_type)), daily_menus!inner(menu_date, is_published, meal_type)')
    .eq('daily_menus.menu_date', deliveryDate)
    .eq('daily_menus.meal_type', mealType)
    .eq('daily_menus.is_published', true)
    .eq('is_available', true)
    .neq('is_thali_option', false)

  const resolvedGroups: ResolvedAdminOptionGroup[] = []

  for (const grp of (groups as any[])) {
    const rawItems = ((grp.thali_option_items as any[]) || []).filter((i: any) => i.is_active !== false)

    // Static items manually configured for this group
    const manualOptions: ResolvedAdminOptionItem[] = rawItems.map((item: any) => ({
      id: item.id,
      label: item.food_items?.name || item.label,
      price_delta: Number(item.price_delta || 0),
      is_default: item.is_default,
      is_available: item.food_items?.is_available ?? true,
      linked_food_item_id: item.linked_food_item_id,
    }))

    // Dynamic daily-menu items matched to this group by category name / type
    const groupNameLower = (grp.name as string).toLowerCase()
    const targetCategoryId = grp.target_category_id

    const matchedDailyItems: any[] = (dailyItems || []).filter((di: any) => {
      if (targetCategoryId && di.food_items?.category_id === targetCategoryId) return true
      const catName = di.food_items?.categories?.name?.toLowerCase() || ''
      const itemName = di.food_items?.name?.toLowerCase() || ''
      const catType = di.food_items?.categories?.category_type || ''

      if (groupNameLower.includes('sabji') || groupNameLower.includes('sabzi') || groupNameLower.includes('curry') || groupNameLower.includes('subji')) {
        return catType === 'sabji' || catName.includes('sabji') || catName.includes('sabzi') || catName.includes('shaak') || catName.includes('bhaji') || itemName.includes('paneer') || itemName.includes('aloo') || itemName.includes('curry')
      }
      if (groupNameLower.includes('roti') || groupNameLower.includes('bread') || groupNameLower.includes('bhakhri') || groupNameLower.includes('rotla') || groupNameLower.includes('puri')) {
        return catType === 'bread' || catName.includes('bread') || catName.includes('roti') || catName.includes('bhakhri') || catName.includes('rotla') || catName.includes('puri') || itemName.includes('roti') || itemName.includes('rotli') || itemName.includes('bhakhri') || itemName.includes('paratha')
      }
      if (groupNameLower.includes('sweet') || groupNameLower.includes('mithai') || groupNameLower.includes('dessert')) {
        return catType === 'sweet' || catName.includes('sweet') || catName.includes('dessert') || catName.includes('mithai') || itemName.includes('halwa') || itemName.includes('shrikhand')
      }
      if (groupNameLower.includes('snack') || groupNameLower.includes('farsan')) {
        return catType === 'snack' || catName.includes('snack') || catName.includes('farsan') || itemName.includes('dhokla') || itemName.includes('samosa')
      }
      if (groupNameLower.includes('accompaniment') || groupNameLower.includes('side')) {
        return catType === 'accompaniment' || catName.includes('accompaniment') || catName.includes('sambhar') || catName.includes('salad') || catName.includes('pickle') || catName.includes('achar')
      }
      return false
    })

    const dailyOptions: ResolvedAdminOptionItem[] = matchedDailyItems.map((dItem: any) => ({
      id: dItem.id,
      label: dItem.food_items?.name || 'Daily Special',
      price_delta: dItem.price_override ? dItem.price_override - (dItem.food_items?.price || 0) : 0,
      is_default: false,
      is_available: dItem.is_available,
      linked_food_item_id: dItem.food_item_id,
    }))

    // Merge: avoid duplicates between daily and manual items
    const dailyFoodIds = new Set(dailyOptions.map((o) => o.linked_food_item_id).filter(Boolean))
    const uniqueManualOptions = manualOptions.filter(
      (mo) => !mo.linked_food_item_id || !dailyFoodIds.has(mo.linked_food_item_id),
    )

    const allOptions = [...dailyOptions, ...uniqueManualOptions].sort(
      (a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0),
    )

    resolvedGroups.push({
      id: grp.id,
      name: grp.name,
      is_required: grp.is_required ?? false,
      options: allOptions,
    })
  }

  return resolvedGroups
}

export async function createAdminOrder(input: CreateAdminOrderInput): Promise<Tables<'orders'>> {
  const branch_id = await getDefaultBranchId()

  let finalAddressId = input.addressId ?? null

  // If user requested to save new address (only if address fields are provided)
  if (input.saveNewAddress && !input.addressId && input.addressLine1 && input.city) {
    const { data: newAddr, error: addrError } = await supabase
      .from('addresses')
      .insert({
        user_id: input.userId,
        contact_name: input.contactName ?? '',
        contact_phone: input.contactPhone ?? '',
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 ?? null,
        landmark: input.landmark ?? null,
        city: input.city,
        state: input.state ?? '',
        pincode: input.pincode ?? '',
        label: input.addressLabel ?? 'home',
        is_default: false,
      })
      .select()
      .single()

    if (!addrError && newAddr) {
      finalAddressId = newAddr.id
    }
  }

  const orderNumber = `FIQ-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`

  const orderInsert: TablesInsert<'orders'> = {
    order_number: orderNumber,
    branch_id,
    user_id: input.userId,
    status: input.orderStatus,
    payment_method: input.paymentMethod ?? null,
    payment_status: input.paymentStatus ?? null,
    payment_reference: input.paymentReference ?? null,
    delivery_date: input.deliveryDate,
    delivery_slot_id: input.deliverySlotId ?? null,
    delivery_slot_label: input.deliverySlotLabel ?? null,
    address_id: finalAddressId,
    contact_name: input.contactName ?? null,
    contact_phone: input.contactPhone ?? null,
    address_line1: input.addressLine1 ?? null,
    address_line2: input.addressLine2 ?? null,
    landmark: input.landmark ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    pincode: input.pincode ?? null,
    subtotal: input.subtotal,
    delivery_charge: input.deliveryCharge,
    discount_amount: input.discountAmount,
    tax_amount: input.taxAmount,
    total_amount: input.totalAmount,
    special_instructions: input.specialInstructions ?? null,
    placed_at: new Date().toISOString(),
  }

  const { data: createdOrder, error: orderErr } = await supabase
    .from('orders')
    .insert(orderInsert)
    .select()
    .single()

  if (orderErr || !createdOrder) {
    throw new Error(orderErr?.message || 'Failed to insert order record')
  }

  // Insert order items
  const itemsToInsert: TablesInsert<'order_items'>[] = input.items.map((item) => ({
    order_id: createdOrder.id,
    food_item_id: item.food_item_id,
    item_name: item.item_name,
    item_kind: item.item_kind,
    item_image_url: item.item_image_url ?? null,
    unit_price: item.unit_price,
    quantity: item.quantity,
    customizations: item.customizations || [],
    customization_total: item.customization_total || 0,
    line_total: item.line_total,
    special_instructions: item.special_instructions ?? null,
  }))

  const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert)
  if (itemsErr) {
    throw new Error(`Order created but failed to save items: ${itemsErr.message}`)
  }

  // Insert audit status history
  await supabase.from('order_status_history').insert({
    order_id: createdOrder.id,
    from_status: null,
    to_status: input.orderStatus,
    note: 'Order placed by Admin on behalf of customer',
  })

  // Increment sold_quantity for each item in the matching daily_menu_items row
  await Promise.allSettled(
    input.items.map((item) =>
      incrementMenuItemSoldQty(item.food_item_id, input.deliveryDate, item.quantity),
    ),
  )

  return createdOrder
}

