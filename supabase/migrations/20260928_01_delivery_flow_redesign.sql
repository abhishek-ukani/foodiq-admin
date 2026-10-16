-- =============================================================================
-- Migration: Delivery Flow Redesign
-- Adds meal_type_tag + preferred_time to addresses
-- Adds meal_type + preferred_delivery_time to orders
-- =============================================================================

-- 1. Add meal_type_tag and preferred_time to addresses
-- meal_type_tag: which meal this address is primarily used for (lunch/dinner/both)
-- preferred_time: customer's preferred delivery time at this address (e.g. 12:30)
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS meal_type_tag text NOT NULL DEFAULT 'both'
    CHECK (meal_type_tag IN ('lunch', 'dinner', 'both')),
  ADD COLUMN IF NOT EXISTS preferred_time time WITHOUT TIME ZONE DEFAULT NULL;

-- 2. Add meal_type and preferred_delivery_time to orders
-- meal_type: whether this order is for lunch or dinner (auto-set from menu)
-- preferred_delivery_time: snapshot of customer's preferred time from their address
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS meal_type text DEFAULT NULL
    CHECK (meal_type IS NULL OR meal_type IN ('breakfast', 'lunch', 'dinner')),
  ADD COLUMN IF NOT EXISTS preferred_delivery_time time WITHOUT TIME ZONE DEFAULT NULL;

-- 3. Backfill existing orders: infer meal_type from delivery_slot_label if possible
UPDATE public.orders
SET meal_type = CASE
  WHEN LOWER(delivery_slot_label) LIKE '%lunch%' THEN 'lunch'
  WHEN LOWER(delivery_slot_label) LIKE '%dinner%' THEN 'dinner'
  WHEN LOWER(delivery_slot_label) LIKE '%breakfast%' THEN 'breakfast'
  ELSE NULL
END
WHERE meal_type IS NULL AND delivery_slot_label IS NOT NULL;

-- 4. Index for efficient address lookup by user + meal_type_tag
CREATE INDEX IF NOT EXISTS idx_addresses_user_meal_tag
  ON public.addresses(user_id, meal_type_tag);

-- 5. Index for admin order filtering by meal_type
CREATE INDEX IF NOT EXISTS idx_orders_meal_type
  ON public.orders(meal_type);
