-- ====================================================================
-- FoodIQ - Fix RLS Policies for Admin Order Placement
-- Run this script in your Supabase SQL Editor (Database → SQL Editor)
-- ====================================================================

-- Ensure is_admin() helper exists (safe re-create)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------
-- ORDERS table
-- --------------------------------------------------------------------
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to orders" ON public.orders;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can place orders for any customer" ON public.orders;

-- Admins: full read/write access to ALL orders (any user_id)
CREATE POLICY "Admins full access to orders" ON public.orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers: can insert only their own orders
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Customers: can read only their own orders
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- Customers: can update only their own orders (e.g. cancel)
CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- --------------------------------------------------------------------
-- ORDER_ITEMS table
-- --------------------------------------------------------------------
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read own order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert own order_items" ON public.order_items;

-- Admins: full access
CREATE POLICY "Admins full access to order_items" ON public.order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Customers: can insert items for their own orders
CREATE POLICY "Users can insert own order_items" ON public.order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = auth.uid()
    )
  );

-- Customers: can read items belonging to their own orders
CREATE POLICY "Users can read own order_items" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_items.order_id
        AND public.orders.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- --------------------------------------------------------------------
-- ORDER_STATUS_HISTORY table (admins need INSERT for audit logs)
-- --------------------------------------------------------------------
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins full access to order_status_history" ON public.order_status_history;
DROP POLICY IF EXISTS "Users can read own order_status_history" ON public.order_status_history;

CREATE POLICY "Admins full access to order_status_history" ON public.order_status_history
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can read own order_status_history" ON public.order_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_status_history.order_id
        AND public.orders.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- Users inserting their own order status history (e.g. cancel)
CREATE POLICY "Users can insert own order_status_history" ON public.order_status_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.id = public.order_status_history.order_id
        AND public.orders.user_id = auth.uid()
    )
    OR public.is_admin()
  );
