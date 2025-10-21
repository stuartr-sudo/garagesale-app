-- Ensure storage buckets exist (idempotent)
-- First, remove old buckets if they exist
DELETE FROM storage.buckets WHERE id IN ('item-images', 'profile-images', 'business-logos');

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('item-images', 'item-images', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']),
  ('profile-images', 'profile-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']),
  ('business-logos', 'business-logos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view item images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own item images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own item images" ON storage.objects;

-- Set up RLS policies for item-images bucket
CREATE POLICY "Anyone can view item images" ON storage.objects
  FOR SELECT USING (bucket_id = 'item-images');

CREATE POLICY "Authenticated users can upload item images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'item-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own item images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'item-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own item images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'item-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

