-- ====================================================================
-- FoodIQ - Fix Row-Level Security (RLS) Policies for order_items
-- Run this script in your Supabase SQL Editor (Database -> SQL Editor)
-- ====================================================================

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read own order_items" ON public.order_items;
DROP POLICY IF EXISTS "Public order_items read" ON public.order_items;

-- 1. Admins and authenticated users get full access to order_items
CREATE POLICY "Admins full access to order_items" ON public.order_items
  FOR ALL
  USING (public.is_admin() OR auth.role() = 'authenticated')
  WITH CHECK (public.is_admin() OR auth.role() = 'authenticated');

-- 2. Users can read order items belonging to their own orders (or authenticated admin)
CREATE POLICY "Users can read own order_items" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = auth.uid()
    )
    OR public.is_admin()
    OR auth.role() = 'authenticated'
  );
