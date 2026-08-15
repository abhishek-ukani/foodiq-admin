-- ====================================================================
-- FoodIQ - Add disabled_item_ids Array to thali_option_groups
-- Run this script in your Supabase SQL Editor (Database -> SQL Editor)
-- ====================================================================

ALTER TABLE public.thali_option_groups
  ADD COLUMN IF NOT EXISTS disabled_item_ids text[] DEFAULT '{}'::text[];
