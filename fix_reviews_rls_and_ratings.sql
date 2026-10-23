-- ====================================================================
-- FoodIQ - Fix Row-Level Security (RLS) Policies & Automation for Reviews
-- Run this script in your Supabase SQL Editor (Database -> SQL Editor)
-- ====================================================================

-- 1. Helper function to check if current user is an Admin
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

-- 2. Ensure helpful_count, variant_id & sub-category rating columns exist on reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS variant_id UUID
    REFERENCES public.food_item_variants(id) ON DELETE SET NULL;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0 NOT NULL;

-- Sub-category ratings: Food, Packaging, Delivery
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS food_rating INT CHECK (food_rating >= 1 AND food_rating <= 5);

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS packaging_rating INT CHECK (packaging_rating >= 1 AND packaging_rating <= 5);

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS delivery_rating INT CHECK (delivery_rating >= 1 AND delivery_rating <= 5);

-- 3. Enable RLS on reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. Drop all existing policies on reviews to avoid conflicts
DROP POLICY IF EXISTS "Public reviews read" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviews select policy" ON public.reviews;
DROP POLICY IF EXISTS "Users can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins full access to reviews" ON public.reviews;
DROP POLICY IF EXISTS "Reviews update policy" ON public.reviews;
DROP POLICY IF EXISTS "Reviews delete policy" ON public.reviews;

-- 5. SELECT Policy:
--    - Anyone (including unauthenticated guests) can view 'approved' reviews
--    - Authenticated users can view their own reviews (even if pending or rejected)
--    - Admins can view ALL reviews
CREATE POLICY "Reviews select policy" ON public.reviews
  FOR SELECT
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR public.is_admin()
  );

-- 6. INSERT Policy:
--    - Authenticated users can submit reviews for themselves
--    - Admins can insert reviews
CREATE POLICY "Users can insert own reviews" ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- 7. UPDATE Policy:
--    - Admins can update any review (approve/reject/add admin response)
--    - Customers can update their own reviews
CREATE POLICY "Reviews update policy" ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- 8. DELETE Policy:
--    - Admins can delete any review
--    - Customers can delete their own reviews
CREATE POLICY "Reviews delete policy" ON public.reviews
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_admin()
  );

-- 9. Unique Index to prevent duplicate reviews for the same order item
--    (Safe: uses IF NOT EXISTS)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_order_food
  ON public.reviews (user_id, order_id, food_item_id)
  WHERE order_id IS NOT NULL AND food_item_id IS NOT NULL;

-- 10. Automation Trigger: Automatically recalculate food_items.rating_average & rating_count
--     whenever a review is inserted, approved, modified, or deleted.
CREATE OR REPLACE FUNCTION public.update_food_item_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_food_item_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_food_item_id := OLD.food_item_id;
  ELSE
    v_food_item_id := NEW.food_item_id;
  END IF;

  IF v_food_item_id IS NOT NULL THEN
    UPDATE public.food_items
    SET
      rating_average = COALESCE((
        SELECT ROUND(AVG(COALESCE(food_rating, rating))::numeric, 1)
        FROM public.reviews
        WHERE food_item_id = v_food_item_id AND status = 'approved'
      ), 0),
      rating_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE food_item_id = v_food_item_id AND status = 'approved'
      )
    WHERE id = v_food_item_id;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.food_item_id IS DISTINCT FROM NEW.food_item_id AND OLD.food_item_id IS NOT NULL THEN
    UPDATE public.food_items
    SET
      rating_average = COALESCE((
        SELECT ROUND(AVG(COALESCE(food_rating, rating))::numeric, 1)
        FROM public.reviews
        WHERE food_item_id = OLD.food_item_id AND status = 'approved'
      ), 0),
      rating_count = (
        SELECT COUNT(*)
        FROM public.reviews
        WHERE food_item_id = OLD.food_item_id AND status = 'approved'
      )
    WHERE id = OLD.food_item_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_food_item_rating ON public.reviews;

CREATE TRIGGER trigger_update_food_item_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_food_item_rating();
