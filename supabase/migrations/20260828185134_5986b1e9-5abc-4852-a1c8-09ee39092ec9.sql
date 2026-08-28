CREATE POLICY "ak docs read own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ak-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ak docs insert own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ak-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ak docs update own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ak-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "ak docs delete own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ak-documents' AND auth.uid()::text = (storage.foldername(name))[1]);