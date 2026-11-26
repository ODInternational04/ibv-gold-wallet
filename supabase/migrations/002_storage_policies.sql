-- Run this in Supabase SQL Editor after creating the bucket manually in the Dashboard
-- Dashboard → Storage → New bucket → name: "verification-documents", Public: OFF

-- Allow users to upload into their own folder (/{user_id}/filename)
CREATE POLICY "Users can upload own verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own docs
CREATE POLICY "Users can view own verification docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to overwrite/re-upload their own docs
CREATE POLICY "Users can replace own verification docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
