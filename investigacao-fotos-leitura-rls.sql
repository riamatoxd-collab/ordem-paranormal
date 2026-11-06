-- Restringir a leitura de fotografias aos perfis reais da campanha.
ALTER POLICY investigation_photo_storage_read ON storage.objects
 USING(
  bucket_id='investigation-photos'
  AND EXISTS(
   SELECT 1 FROM public.profiles p
   WHERE p.id=(SELECT auth.uid()) AND p.role IN ('mestre','jogador')
  )
  AND EXISTS(
   SELECT 1 FROM public.investigation_clues c
   WHERE c.storage_path=storage.objects.name
     AND (c.visible OR (SELECT app_private.op_is_master()))
  )
 );