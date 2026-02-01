-- Create token-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'token-images',
  'token-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'token-images');

-- Create policy for authenticated upload (using service role)
CREATE POLICY "Service role upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'token-images');

-- Create policy for service role delete
CREATE POLICY "Service role delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'token-images');
