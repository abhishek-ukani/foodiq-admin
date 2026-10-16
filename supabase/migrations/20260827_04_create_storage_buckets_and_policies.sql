-- ====================================================================
-- Migration: 20260827_04_create_storage_buckets_and_policies.sql
-- Description: Creates Supabase Storage buckets ('food-images', 'banners', 'branding')
--              and configures Row Level Security (RLS) policies for uploads and public access.
-- ====================================================================

-- 1. CREATE STORAGE BUCKETS IF THEY DON'T EXIST
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'food-images', 
    'food-images', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'banners', 
    'banners', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
  ),
  (
    'branding', 
    'branding', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. ROW LEVEL SECURITY (already enabled by default on storage.objects by Supabase)
-- (Omitted ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY to prevent ERROR 42501)

-- 3. PUBLIC READ ACCESS POLICY
-- Allows anyone to view/fetch images from these public buckets
DROP POLICY IF EXISTS "Public Read FoodIQ Assets" ON storage.objects;
CREATE POLICY "Public Read FoodIQ Assets"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('food-images', 'banners', 'branding'));

-- 4. UPLOAD (INSERT) POLICY
-- Allows authenticated users (admins) and application clients to upload images to these buckets
DROP POLICY IF EXISTS "Allow Upload FoodIQ Assets" ON storage.objects;
CREATE POLICY "Allow Upload FoodIQ Assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id IN ('food-images', 'banners', 'branding')
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );

-- 5. UPDATE POLICY
-- Allows updating files in these buckets
DROP POLICY IF EXISTS "Allow Update FoodIQ Assets" ON storage.objects;
CREATE POLICY "Allow Update FoodIQ Assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('food-images', 'banners', 'branding')
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  )
  WITH CHECK (
    bucket_id IN ('food-images', 'banners', 'branding')
  );

-- 6. DELETE POLICY
-- Allows deleting files in these buckets
DROP POLICY IF EXISTS "Allow Delete FoodIQ Assets" ON storage.objects;
CREATE POLICY "Allow Delete FoodIQ Assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('food-images', 'banners', 'branding')
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon')
  );
