-- Supabase Storage bucket for syllabus PDFs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY uploads_storage_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY uploads_storage_insert_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY uploads_storage_delete_own ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]
  );
