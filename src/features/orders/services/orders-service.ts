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
  contactName: string
  contactPhone: string
  addressId?: string | null
  addressLine1: string
  addressLine2?: string | null
  landmark?: string | null
  city: string
  state: string
  pincode: string
  saveNewAddress?: boolean
  addressLabel?: 'home' | 'work' | 'other'
  deliveryDate: string
  deliverySlotId?: string | null
  deliverySlotLabel?: string | null
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
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

export async function createAdminOrder(input: CreateAdminOrderInput): Promise<Tables<'orders'>> {
  const branch_id = await getDefaultBranchId()

  let finalAddressId = input.addressId ?? null

  // If user requested to save new address
  if (input.saveNewAddress && !input.addressId) {
    const { data: newAddr, error: addrError } = await supabase
      .from('addresses')
      .insert({
        user_id: input.userId,
        contact_name: input.contactName,
        contact_phone: input.contactPhone,
        address_line1: input.addressLine1,
        address_line2: input.addressLine2 ?? null,
        landmark: input.landmark ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
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
    payment_method: input.paymentMethod,
    payment_status: input.paymentStatus,
    payment_reference: input.paymentReference ?? null,
    delivery_date: input.deliveryDate,
    delivery_slot_id: input.deliverySlotId ?? null,
    delivery_slot_label: input.deliverySlotLabel ?? null,
    address_id: finalAddressId,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    address_line1: input.addressLine1,
    address_line2: input.addressLine2 ?? null,
    landmark: input.landmark ?? null,
    city: input.city,
    state: input.state,
    pincode: input.pincode,
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

