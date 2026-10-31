-- ==============================================================================
-- Migration: 20261101_003_storage_setup.sql
-- Description: Storage bucket and security policies for product photographs
-- Bucket: product-images (public read, admin write/delete)
-- ==============================================================================

-- 1. Create the storage bucket if it does not already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Storage Policies for product-images bucket

-- Anyone can view product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');

-- Only verified administrators can upload images
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins can upload product images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'product-images'
        AND public.is_admin()
    );

-- Only verified administrators can update/replace images
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins can update product images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'product-images'
        AND public.is_admin()
    )
    WITH CHECK (
        bucket_id = 'product-images'
        AND public.is_admin()
    );

-- Only verified administrators can delete images
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins can delete product images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'product-images'
        AND public.is_admin()
    );
