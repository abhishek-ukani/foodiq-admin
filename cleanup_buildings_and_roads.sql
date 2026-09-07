-- ============================================================================
-- FoodIQ - Remove Custom Buildings & Roads Migration
-- Reverts to standard Google Maps location search validated against delivery_areas
-- Distance from kitchen and price per distance (delivery_fee_rules) remain active.
-- ============================================================================

-- 1. Remove foreign key columns from addresses table
ALTER TABLE public.addresses
  DROP COLUMN IF EXISTS delivery_building_id,
  DROP COLUMN IF EXISTS delivery_road_id;

-- 2. Drop custom tables and their RLS policies
DROP TABLE IF EXISTS public.delivery_buildings CASCADE;
DROP TABLE IF EXISTS public.delivery_roads CASCADE;

-- 3. Ensure delivery_areas table has standard structure and active RLS
-- Note: delivery_areas remains the single list of deliverable areas
ALTER TABLE public.delivery_areas
  ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_above NUMERIC DEFAULT 0;

DROP POLICY IF EXISTS "Public read delivery_areas" ON public.delivery_areas;
CREATE POLICY "Public read delivery_areas" ON public.delivery_areas
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage delivery_areas" ON public.delivery_areas;
CREATE POLICY "Admins manage delivery_areas" ON public.delivery_areas
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
