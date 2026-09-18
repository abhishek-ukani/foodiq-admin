/**
 * Mirrors the SQL under `supabase/migrations`. Regenerate after schema changes:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'customer' | 'admin' | 'delivery_boy'
export type MealType = 'breakfast' | 'lunch' | 'dinner'
export type ItemKind = 'single' | 'thali'
export type FoodType = 'veg' | 'jain' | 'vegan' | 'egg' | 'non_veg'
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
export type PaymentMethod = 'cash' | 'upi'
export type PaymentStatus = 'pending' | 'awaiting_verification' | 'paid' | 'failed' | 'refunded'
export type AddressLabel = 'home' | 'work' | 'other'
export type NotificationType = 'order_update' | 'offer' | 'announcement' | 'maintenance' | 'system'
export type NotificationAudience = 'all' | 'customers' | 'single_user'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'archived'
export type PolicySlug = 'privacy' | 'terms' | 'refund' | 'about' | 'shipping'
export type BannerPlacement = 'hero' | 'promo_strip' | 'menu_top' | 'popup'
export type CategoryType = 'thali' | 'sabji' | 'bread' | 'sweet' | 'snack' | 'beverage' | 'rice' | 'general'
export type UnitType = 'gm' | 'kg' | 'pc' | 'ml' | 'ltr'
export type StockStatus = 'IN_STOCK' | 'FEW_LEFT' | 'OUT_OF_STOCK'
export type SupplierStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED'
export type PoStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'

type BranchRow = {
  id: string
  name: string
  slug: string
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  is_default: boolean
  opening_time: string | null
  closing_time: string | null
  timezone: string | null
  created_at: string
  updated_at: string
}

type ProfileRow = {
  id: string
  role: UserRole
  full_name: string | null
  phone: string | null
  email: string | null
  avatar_url: string | null
  date_of_birth: string | null
  is_active: boolean
  is_subscription_eligible: boolean
  total_orders: number
  total_spent: number
  last_order_at: string | null
  marketing_opt_in: boolean
  created_at: string
  updated_at: string
}

type DeliveryAreaRow = {
  id: string
  name: string
  area_key: string | null
  pincode: string | null
  city: string | null
  state: string | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type DeliveryBuildingRow = {
  id: number
  name: string
  delivery_charge: number
  area_hint: string | null
  pincode: string | null
  city: string
  state: string
  display_order: number
  is_active: boolean
  created_at: string
}

type DeliveryRoadRow = {
  id: number
  name: string
  delivery_charge: number
  area_hint: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

type DeliveryZoneRow = {
  id: number
  name: string
  pincode: string | null
  zone_type: 'FREE' | 'PAID' | 'BLOCKED'
  fixed_fee: number
  is_active: boolean
  created_at: string
}

type DeliveryFeeRuleRow = {
  id: number
  min_distance_km: number
  max_distance_km: number
  fee: number
  is_active: boolean
  created_at: string
}

type DeliverySlotRow = {
  id: string
  branch_id: string
  label: string
  meal_type: MealType
  start_time: string
  end_time: string
  cutoff_time: string
  max_orders: number | null
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type AddressRow = {
  id: string
  user_id: string
  delivery_area_id: string | null
  delivery_building_id: number | null
  delivery_road_id: number | null
  label: AddressLabel
  custom_label: string | null
  contact_name: string
  contact_phone: string
  address_line1: string
  address_line2: string | null
  landmark: string | null
  sublocality: string | null
  city: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null
  is_default: boolean
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: string
  name: string
  name_gujarati: string | null
  slug: string
  description: string | null
  image_url: string | null
  icon: string | null
  display_order: number
  is_active: boolean
  category_type: CategoryType
  created_at: string
  updated_at: string
}

type FoodItemRow = {
  id: string
  branch_id: string
  category_id: string | null
  kind: ItemKind
  name: string
  name_gujarati: string | null
  slug: string
  description: string | null
  ingredients: string[] | null
  food_type: FoodType
  price: number
  compare_price: number | null
  cost_price: number | null
  unit_label: string | null
  serves: number | null
  prep_minutes: number | null
  spice_level: number | null
  calories: number | null
  nutrition: Json | null
  image_url: string | null
  gallery_urls: string[] | null
  is_available: boolean
  is_featured: boolean
  is_swaminarayan_available: boolean
  is_vaishnav_available: boolean
  is_jain_available: boolean
  track_stock: boolean
  stock_quantity: number
  rating_average: number
  rating_count: number
  total_sold: number
  display_order: number
  created_at: string
  updated_at: string
}

type ThaliItemRow = {
  id: string
  thali_id: string
  food_item_id: string | null
  custom_name: string | null
  quantity: number
  display_order: number
  created_at: string
}

type ThaliOptionGroupType = 'static_choice' | 'daily_menu_choice' | 'optional_addon'

type ThaliOptionGroupRow = {
  id: string
  food_item_id: string
  name: string
  description: string | null
  group_type: ThaliOptionGroupType
  target_category_type: CategoryType
  min_select: number
  max_select: number
  is_required: boolean
  display_order: number
  is_active: boolean
  disabled_item_ids: string[] | null
  created_at: string
}

type ThaliOptionItemRow = {
  id: string
  group_id: string
  linked_food_item_id: string | null
  label: string
  price_delta: number
  is_default: boolean
  display_order: number
  is_active: boolean
  created_at: string
}

type ThaliComponentCategoryType = 'bread' | 'sabji' | 'sweet' | 'snack' | 'accompaniment' | 'beverage' | 'rice'

type ThaliComponentRow = {
  id: string
  food_item_id: string
  category_type: ThaliComponentCategoryType
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

type SubscriptionPlanRow = {
  id: string
  branch_id: string | null
  name: string
  slug: string
  thali_food_item_id: string
  duration_days: number
  total_meals: number
  meal_type_allowed: 'lunch_only' | 'dinner_only' | 'both'
  price: number
  discount_percentage: number
  description: string | null
  is_active: boolean
  created_at: string
}

type UserSubscriptionRow = {
  id: string
  user_id: string
  plan_id: string
  address_id: string | null
  default_delivery_slot_id: string | null
  start_date: string
  end_date: string
  total_meals: number
  meals_remaining: number
  status: 'active' | 'paused' | 'cancelled' | 'expired'
  paused_from: string | null
  paused_until: string | null
  created_at: string
}

type SubscriptionDailyDeliveryRow = {
  id: string
  subscription_id: string
  user_id: string
  delivery_date: string
  meal_type: MealType
  status: 'scheduled' | 'customized' | 'auto_fulfilled' | 'skipped' | 'delivered' | 'cancelled'
  order_id: string | null
  selected_customizations: Json
  customized_at: string | null
  created_at: string
}

type ItemCustomizationRow = {
  id: string
  food_item_id: string
  name: string
  price_delta: number
  is_default: boolean
  display_order: number
  is_active: boolean
  created_at: string
}

type DailyMenuRow = {
  id: string
  branch_id: string
  menu_date: string
  meal_type: MealType
  title: string | null
  note: string | null
  cutoff_time: string | null
  is_published: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

type DailyMenuItemRow = {
  id: string
  daily_menu_id: string
  food_item_id: string
  price_override: number | null
  available_quantity: number | null
  sold_quantity: number
  is_available: boolean
  is_special: boolean
  is_standalone_sale: boolean
  is_thali_option: boolean
  cutoff_time: string | null
  cutoff_note: string | null
  display_order: number
  created_at: string
  updated_at: string
}

type PriceHistoryRow = {
  id: string
  food_item_id: string
  old_price: number | null
  new_price: number
  old_compare_price: number | null
  new_compare_price: number | null
  changed_by: string | null
  reason: string | null
  created_at: string
}

type FoodItemVariantRow = {
  id: string
  food_item_id: string
  sku: string
  label: string
  unit_type: UnitType
  quantity: number
  price: number
  compare_price: number | null
  cost_price: number | null
  stock_status: StockStatus
  stock_quantity: number
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

type SupplierRow = {
  id: string
  branch_id: string | null
  name: string
  email: string | null
  phone: string | null
  address: string | null
  gst_number: string | null
  status: SupplierStatus
  notes: string | null
  created_at: string
  updated_at: string
}

type PurchaseOrderRow = {
  id: string
  branch_id: string
  supplier_id: string
  po_number: string
  status: PoStatus
  ordered_at: string | null
  expected_delivery_date: string | null
  received_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

type PurchaseOrderItemRow = {
  id: string
  purchase_order_id: string
  variant_id: string | null
  food_item_id: string | null
  item_name: string
  ordered_quantity: number
  received_quantity: number
  unit_cost: number
  created_at: string
}

type FavoriteRow = {
  id: string
  user_id: string
  food_item_id: string
  created_at: string
}

type CartItemRow = {
  id: string
  user_id: string
  food_item_id: string
  variant_id: string | null
  daily_menu_item_id: string | null
  quantity: number
  customizations: Json
  special_instructions: string | null
  delivery_date: string | null
  delivery_slot_id: string | null
  created_at: string
  updated_at: string
}

type CouponRow = {
  id: string
  branch_id: string | null
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount: number | null
  min_order_amount: number
  usage_limit: number | null
  usage_limit_per_user: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type OrderRow = {
  id: string
  order_number: string
  branch_id: string
  user_id: string
  status: OrderStatus
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus | null
  payment_reference: string | null
  payment_proof_url: string | null
  paid_at: string | null
  delivery_date: string
  delivery_slot_id: string | null
  delivery_slot_label: string | null
  delivery_area_id: string | null
  address_id: string | null
  contact_name: string | null
  contact_phone: string | null
  address_line1: string | null
  address_line2: string | null
  landmark: string | null
  city: string | null
  state: string | null
  pincode: string | null
  subtotal: number
  delivery_charge: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  coupon_id: string | null
  coupon_code: string | null
  special_instructions: string | null
  cancellation_reason: string | null
  rejection_reason: string | null
  preferred_lunch_time: string | null
  is_out_of_zone: boolean
  zone_label: string | null
  placed_at: string
  accepted_at: string | null
  prepared_at: string | null
  dispatched_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

type OrderItemRow = {
  id: string
  order_id: string
  food_item_id: string | null
  variant_id: string | null
  item_name: string
  item_kind: ItemKind
  item_image_url: string | null
  item_snapshot: Json | null
  variant_snapshot: Json | null
  unit_price: number
  quantity: number
  customizations: Json
  customization_total: number
  line_total: number
  special_instructions: string | null
  created_at: string
}

type OrderStatusHistoryRow = {
  id: string
  order_id: string
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: string | null
  note: string | null
  created_at: string
}

export type UpiQrCodeRow = {
  id: string
  branch_id: string
  label: string
  upi_id: string | null
  payee_name: string | null
  qr_image_url: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type ReviewRow = {
  id: string
  user_id: string
  food_item_id: string | null
  variant_id: string | null
  order_id: string | null
  rating: number
  title: string | null
  comment: string | null
  image_urls: string[] | null
  status: ReviewStatus
  admin_response: string | null
  responded_at: string | null
  is_featured: boolean
  helpful_count: number
  created_at: string
  updated_at: string
}

type NotificationRow = {
  id: string
  user_id: string | null
  type: NotificationType
  audience: NotificationAudience
  title: string
  body: string | null
  image_url: string | null
  action_url: string | null
  order_id: string | null
  is_read: boolean
  read_at: string | null
  created_by: string | null
  created_at: string
}

type ContactMessageRow = {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  status: ContactStatus
  admin_note: string | null
  handled_by: string | null
  handled_at: string | null
  created_at: string
}

type PolicyRow = {
  id: string
  slug: PolicySlug
  title: string
  content: string
  meta_description: string | null
  is_published: boolean
  updated_by: string | null
  created_at: string
  updated_at: string
}

type FaqRow = {
  id: string
  question: string
  answer: string
  category: string | null
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

type BannerRow = {
  id: string
  branch_id: string | null
  placement: BannerPlacement
  title: string | null
  subtitle: string | null
  image_url: string
  mobile_image_url: string | null
  cta_label: string | null
  cta_url: string | null
  display_order: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type TestimonialRow = {
  id: string
  author_name: string
  author_role: string | null
  author_avatar_url: string | null
  quote: string
  rating: number | null
  display_order: number
  is_published: boolean
  created_at: string
  updated_at: string
}

type SystemConfigRow = {
  key: string
  value: Json
  description: string | null
  is_public: boolean
  updated_by: string | null
  updated_at: string
}

type AuditLogRow = {
  id: string
  actor_id: string | null
  actor_email: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

/** Columns the database fills in for us on insert. */
type Generated =
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'order_number'
  | 'total_orders'
  | 'total_spent'
  | 'rating_average'
  | 'rating_count'
  | 'total_sold'
  | 'used_count'
  | 'sold_quantity'

/** Nullable columns are optional on insert too — omitting them just inserts NULL. */
type NullableKeyOf<T> = { [K in keyof T]: null extends T[K] ? K : never }[keyof T]

type OptionalOnInsert<T, ExtraOptional extends keyof T = never> =
  | Extract<keyof T, Generated>
  | NullableKeyOf<T>
  | ExtraOptional

type InsertOf<T, ExtraOptional extends keyof T = never> = Omit<
  T,
  OptionalOnInsert<T, ExtraOptional>
> &
  Partial<Pick<T, OptionalOnInsert<T, ExtraOptional>>>

type TableOf<T, ExtraOptional extends keyof T = never> = {
  Row: T
  Insert: InsertOf<T, ExtraOptional>
  Update: Partial<T>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      branches: TableOf<BranchRow>
      profiles: TableOf<ProfileRow>
      delivery_areas: TableOf<
        DeliveryAreaRow,
        'display_order' | 'is_active'
      >
      delivery_buildings: TableOf<
        DeliveryBuildingRow,
        'delivery_charge' | 'display_order' | 'is_active'
      >
      delivery_roads: TableOf<
        DeliveryRoadRow,
        'delivery_charge' | 'display_order' | 'is_active'
      >
      delivery_zones: TableOf<DeliveryZoneRow, 'fixed_fee' | 'is_active'>
      delivery_fee_rules: TableOf<DeliveryFeeRuleRow, 'is_active'>
      delivery_slots: TableOf<DeliverySlotRow, 'display_order' | 'is_active'>
      addresses: TableOf<AddressRow, 'is_default'>
      categories: TableOf<CategoryRow>
      food_items: TableOf<FoodItemRow>
      food_item_variants: TableOf<FoodItemVariantRow, 'stock_status' | 'stock_quantity' | 'is_active' | 'display_order'>
      suppliers: TableOf<SupplierRow, 'status'>
      purchase_orders: TableOf<PurchaseOrderRow, 'status'>
      purchase_order_items: TableOf<PurchaseOrderItemRow, 'received_quantity'>
      thali_items: TableOf<ThaliItemRow>
      thali_option_groups: TableOf<ThaliOptionGroupRow, 'min_select' | 'max_select' | 'is_required' | 'display_order' | 'is_active'>
      thali_option_items: TableOf<ThaliOptionItemRow, 'price_delta' | 'is_default' | 'display_order' | 'is_active'>
      thali_components: TableOf<ThaliComponentRow, 'is_active' | 'display_order'>
      subscription_plans: TableOf<SubscriptionPlanRow, 'discount_percentage' | 'is_active'>
      user_subscriptions: TableOf<UserSubscriptionRow, 'status'>
      subscription_daily_deliveries: TableOf<SubscriptionDailyDeliveryRow, 'status'>
      item_customizations: TableOf<
        ItemCustomizationRow,
        'price_delta' | 'is_default' | 'display_order' | 'is_active'
      >
      daily_menus: TableOf<DailyMenuRow>
      daily_menu_items: TableOf<DailyMenuItemRow, 'display_order' | 'is_available' | 'is_special'>
      price_history: TableOf<PriceHistoryRow>
      favorites: TableOf<FavoriteRow>
      cart_items: TableOf<CartItemRow>
      coupons: TableOf<CouponRow>
      orders: TableOf<OrderRow>
      order_items: TableOf<OrderItemRow>
      order_status_history: TableOf<OrderStatusHistoryRow>
      reviews: TableOf<ReviewRow, 'status' | 'is_featured'>
      notifications: TableOf<NotificationRow, 'type' | 'audience' | 'is_read'>
      contact_messages: TableOf<ContactMessageRow, 'status'>
      policies: TableOf<PolicyRow, 'content' | 'is_published'>
      faqs: TableOf<FaqRow, 'display_order' | 'is_published'>
      banners: TableOf<BannerRow, 'placement' | 'display_order' | 'is_active'>
      testimonials: TableOf<TestimonialRow, 'display_order' | 'is_published'>
      system_config: TableOf<SystemConfigRow>
      audit_logs: TableOf<AuditLogRow>
    }
    Views: Record<string, never>
    Functions: {
      place_order: {
        Args: {
          p_address_id: string
          p_delivery_date: string
          p_delivery_slot_id: string
          p_payment_method: PaymentMethod
          p_special_instructions?: string | null
          p_payment_reference?: string | null
        }
        Returns: OrderRow
      }
      reorder: {
        Args: { p_order_id: string }
        Returns: number
      }
      mark_notifications_read: {
        Args: { p_ids?: string[] | null }
        Returns: number
      }
      report_dashboard_summary: {
        Args: { p_branch_id?: string | null }
        Returns: Json
      }
      report_sales_series: {
        Args: {
          p_from: string
          p_to: string
          p_granularity?: 'day' | 'month' | 'year'
          p_branch_id?: string | null
        }
        Returns: {
          bucket: string
          order_count: number
          delivered_count: number
          revenue: number
          average_order_value: number
        }[]
      }
      report_popular_items: {
        Args: { p_from: string; p_to: string; p_limit?: number; p_branch_id?: string | null }
        Returns: {
          food_item_id: string
          item_name: string
          item_kind: ItemKind
          image_url: string | null
          units_sold: number
          revenue: number
          order_count: number
        }[]
      }
      report_customers: {
        Args: { p_from: string; p_to: string; p_limit?: number }
        Returns: {
          user_id: string
          full_name: string | null
          email: string | null
          phone: string | null
          order_count: number
          total_spent: number
          average_order_value: number
          first_order_at: string | null
          last_order_at: string | null
          is_repeat_customer: boolean
        }[]
      }
      report_retention: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
    }
    Enums: {
      user_role: UserRole
      meal_type: MealType
      item_kind: ItemKind
      food_type: FoodType
      order_status: OrderStatus
      payment_method: PaymentMethod
      payment_status: PaymentStatus
      address_label: AddressLabel
      notification_type: NotificationType
      notification_audience: NotificationAudience
      review_status: ReviewStatus
      contact_status: ContactStatus
      policy_slug: PolicySlug
      banner_placement: BannerPlacement
      unit_type: UnitType
      stock_status: StockStatus
      supplier_status: SupplierStatus
      po_status: PoStatus
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
