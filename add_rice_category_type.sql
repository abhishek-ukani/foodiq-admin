-- ====================================================================
-- FoodIQ - Add 'rice' to category_type Enum in Supabase Database
-- Run this script in your Supabase SQL Editor (Database -> SQL Editor)
-- ====================================================================

-- 1. Add 'rice' value to the public.category_type Postgres ENUM
ALTER TYPE public.category_type ADD VALUE IF NOT EXISTS 'rice';

-- 2. Update CHECK constraint on thali_components table to allow 'rice'
DO $$ BEGIN
  ALTER TABLE public.thali_components DROP CONSTRAINT IF EXISTS thali_components_category_type_check;
  ALTER TABLE public.thali_components ADD CONSTRAINT thali_components_category_type_check 
    CHECK (category_type IN ('bread', 'sabji', 'sweet', 'snack', 'accompaniment', 'beverage', 'rice'));
EXCEPTION
  WHEN undefined_table THEN null;
END $$;
