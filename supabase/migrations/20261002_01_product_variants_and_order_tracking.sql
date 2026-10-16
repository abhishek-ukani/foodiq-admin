-- =============================================================================
-- Migration: Product Variants & Order Tracking Redesign
-- 1. Adds product_code to food_items (stable canonical product identifier)
-- 2. Adds variant_code, is_default, nutrition_per_unit, allergens to food_item_variants
-- 3. Adds product_code, variant_code, variant_sku to order_items
-- 4. Creates atomic daily order number generator sequence & function
-- 5. Creates report_variant_sales analytics view for data visualization & AI prediction
-- =============================================================================

-- 1. food_items: Add canonical product_code
ALTER TABLE public.food_items
  ADD COLUMN IF NOT EXISTS product_code text DEFAULT NULL;

-- Backfill existing food_items product_code from category and slug
UPDATE public.food_items fi
SET product_code = UPPER(
  COALESCE(
    (SELECT regexp_replace(upper(c.category_type::text), '[^A-Z0-9]', '', 'g') FROM public.categories c WHERE c.id = fi.category_id),
    'ITEM'
  ) || '_' || regexp_replace(replace(upper(fi.slug), '-', '_'), '[^A-Z0-9_]', '', 'g')
)
WHERE fi.product_code IS NULL;

-- Ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_items_product_code
  ON public.food_items(product_code)
  WHERE product_code IS NOT NULL;

-- 2. food_item_variants: Add variant_code, is_default, nutrition, allergens
ALTER TABLE public.food_item_variants
  ADD COLUMN IF NOT EXISTS variant_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nutrition_per_unit jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS allergens text[] DEFAULT '{}'::text[];

-- Backfill existing food_item_variants variant_code
UPDATE public.food_item_variants fiv
SET variant_code = COALESCE(
  (
    SELECT fi.product_code || '_' || fiv.quantity || UPPER(fiv.unit_type::text)
    FROM public.food_items fi
    WHERE fi.id = fiv.food_item_id AND fi.product_code IS NOT NULL
  ),
  fiv.sku
)
WHERE fiv.variant_code IS NULL;

-- Ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_item_variants_variant_code
  ON public.food_item_variants(variant_code)
  WHERE variant_code IS NOT NULL;

-- 3. order_items: Add denormalized tracking columns
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS product_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS variant_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS variant_sku text DEFAULT NULL;

-- Backfill existing order_items where items/variants are still present
UPDATE public.order_items oi
SET product_code = fi.product_code
FROM public.food_items fi
WHERE oi.food_item_id = fi.id AND oi.product_code IS NULL AND fi.product_code IS NOT NULL;

UPDATE public.order_items oi
SET variant_code = fiv.variant_code,
    variant_sku = fiv.sku
FROM public.food_item_variants fiv
WHERE oi.variant_id = fiv.id AND oi.variant_code IS NULL;

-- Indexes for AI prediction, customer past-order search, and reporting
CREATE INDEX IF NOT EXISTS idx_order_items_product_code
  ON public.order_items(product_code);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_code
  ON public.order_items(variant_code);

CREATE INDEX IF NOT EXISTS idx_order_items_variant_sku
  ON public.order_items(variant_sku);

-- 4. Order Number Generation Sequence & Function
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_order_number(
  p_cat_code text DEFAULT 'ORD',
  p_slot_code text DEFAULT 'L',
  p_date text DEFAULT NULL
) RETURNS text AS $$
DECLARE
  v_yyyymmdd text;
  v_seq bigint;
BEGIN
  IF p_date IS NOT NULL AND length(p_date) >= 8 THEN
    v_yyyymmdd := right(replace(left(p_date, 10), '-', ''), 6);
  ELSE
    v_yyyymmdd := to_char(now(), 'YYMMDD');
  END IF;

  v_seq := nextval('public.order_number_seq');
  RETURN 'FIQ-' || COALESCE(p_cat_code, 'ORD') || '-' || COALESCE(p_slot_code, 'L') || v_yyyymmdd || '-' || lpad((v_seq % 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 5. Analytics View for Variant Sales & Demand Forecasting (AI/BI)
CREATE OR REPLACE VIEW public.report_variant_sales AS
SELECT
  oi.product_code,
  COALESCE(fi.name, oi.item_name) AS product_name,
  oi.variant_code,
  oi.variant_sku,
  COALESCE(oi.variant_snapshot->>'unit_type', fiv.unit_type::text) AS unit_type,
  COALESCE((oi.variant_snapshot->>'quantity')::numeric, fiv.quantity) AS pack_qty,
  DATE_TRUNC('day', o.placed_at) AS sale_date,
  o.meal_type,
  o.delivery_area_id,
  SUM(oi.quantity)::numeric AS units_sold,
  SUM(oi.line_total)::numeric AS revenue
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
LEFT JOIN public.food_items fi ON fi.id = oi.food_item_id
LEFT JOIN public.food_item_variants fiv ON fiv.id = oi.variant_id
WHERE o.status NOT IN ('cancelled', 'rejected')
GROUP BY 1,2,3,4,5,6,7,8,9;
