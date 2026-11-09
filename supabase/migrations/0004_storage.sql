-- ==============================================================================
-- Migration 0004: Supabase Storage Buckets & Policies
-- Spec: Plan 02 Task 2.1 / REVIEW-2026-11-08
-- ==============================================================================

BEGIN;

-- 1. Create Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
    ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
    ('listing-content', 'listing-content', false, 52428800, ARRAY['application/pdf', 'application/json', 'text/plain'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies for 'avatars'
-- Anyone can view avatars because it's a public avatar bucket
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Users can only upload and modify avatars in their own user folder {uid}/...
DROP POLICY IF EXISTS "Users can manage own avatar" ON storage.objects;
CREATE POLICY "Users can manage own avatar"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Storage Policies for 'documents'
-- Users can only access documents inside their own user folder {uid}/...
DROP POLICY IF EXISTS "Users can access own documents" ON storage.objects;
CREATE POLICY "Users can access own documents"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Storage Policies for 'listing-content' (Private DRM)
-- Authors can manage their own listing contents
DROP POLICY IF EXISTS "Authors can manage listing content" ON storage.objects;
CREATE POLICY "Authors can manage listing content"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'listing-content' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'listing-content' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Buyers can read listing content if purchased
DROP POLICY IF EXISTS "Buyers can read purchased listing content" ON storage.objects;
CREATE POLICY "Buyers can read purchased listing content"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'listing-content'
        AND EXISTS (
            SELECT 1 FROM public.know_inherit_purchases p
            JOIN public.know_inherit_listings l ON l.id = p.listing_id
            WHERE p.buyer_id = auth.uid()
              AND l.full_content_url = name
        )
    );

COMMIT;
