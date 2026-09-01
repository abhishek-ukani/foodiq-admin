-- ====================================================================
-- FoodIQ - Make optional order fields nullable in the orders table
-- Run this in Supabase SQL Editor (Database → SQL Editor)
-- ====================================================================

-- Payment fields (admin may record payment later)
ALTER TABLE public.orders ALTER COLUMN payment_method DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN payment_status  DROP NOT NULL;

-- Contact & address fields (admin may add delivery address later)
ALTER TABLE public.orders ALTER COLUMN contact_name  DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN contact_phone DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN address_line1 DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN city          DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN state         DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN pincode       DROP NOT NULL;
