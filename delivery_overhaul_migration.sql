-- ============================================================================
-- FoodIQ Delivery System Overhaul Migration
-- ============================================================================

-- 1. Create delivery_buildings table
CREATE TABLE IF NOT EXISTS public.delivery_buildings (
  id              SERIAL PRIMARY KEY,
  name            TEXT    NOT NULL,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  area_hint       TEXT,
  pincode         TEXT,
  city            TEXT NOT NULL DEFAULT 'Ahmedabad',
  state           TEXT NOT NULL DEFAULT 'Gujarat',
  display_order   INT  NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_buildings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read delivery_buildings" ON public.delivery_buildings;
CREATE POLICY "Public read delivery_buildings" ON public.delivery_buildings
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage delivery_buildings" ON public.delivery_buildings;
CREATE POLICY "Admins manage delivery_buildings" ON public.delivery_buildings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 2. Create delivery_roads table
CREATE TABLE IF NOT EXISTS public.delivery_roads (
  id              SERIAL PRIMARY KEY,
  name            TEXT    NOT NULL,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  area_hint       TEXT,
  display_order   INT  NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_roads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read delivery_roads" ON public.delivery_roads;
CREATE POLICY "Public read delivery_roads" ON public.delivery_roads
  FOR SELECT TO anon, authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage delivery_roads" ON public.delivery_roads;
CREATE POLICY "Admins manage delivery_roads" ON public.delivery_roads
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 3. Repurpose delivery_areas table
ALTER TABLE public.delivery_areas DROP COLUMN IF EXISTS branch_id;
ALTER TABLE public.delivery_areas DROP COLUMN IF EXISTS delivery_charge;
ALTER TABLE public.delivery_areas DROP COLUMN IF EXISTS min_order_amount;
ALTER TABLE public.delivery_areas DROP COLUMN IF EXISTS free_delivery_above;
ALTER TABLE public.delivery_areas DROP COLUMN IF EXISTS estimated_minutes;
ALTER TABLE public.delivery_areas ALTER COLUMN pincode DROP NOT NULL;

ALTER TABLE public.delivery_areas ADD COLUMN IF NOT EXISTS area_key TEXT;
ALTER TABLE public.delivery_areas ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- Clear legacy data
DELETE FROM public.delivery_areas;

DROP POLICY IF EXISTS "Delivery areas select policy" ON public.delivery_areas;
DROP POLICY IF EXISTS "Admins full access to delivery_areas" ON public.delivery_areas;
DROP POLICY IF EXISTS "Public read delivery_areas" ON public.delivery_areas;
DROP POLICY IF EXISTS "Admins manage delivery_areas" ON public.delivery_areas;

CREATE POLICY "Public read delivery_areas" ON public.delivery_areas
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins manage delivery_areas" ON public.delivery_areas
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());


-- 4. Alter addresses table
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS delivery_building_id INT REFERENCES public.delivery_buildings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delivery_road_id     INT REFERENCES public.delivery_roads(id)     ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS custom_label         TEXT,
  ADD COLUMN IF NOT EXISTS sublocality          TEXT;


-- 5. Alter orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preferred_lunch_time TEXT,
  ADD COLUMN IF NOT EXISTS is_out_of_zone       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS zone_label           TEXT;


-- 6. Seed kitchen_location in system_config
INSERT INTO public.system_config (key, value, description, is_public)
VALUES (
  'kitchen_location',
  '{"lat": 23.0392, "lng": 72.5085}',
  'Kitchen GPS coordinates for delivery distance calculation',
  true
) ON CONFLICT (key) DO NOTHING;
