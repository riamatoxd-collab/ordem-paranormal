-- Fotos das cartas de investigação: bucket privado, cartões compartilhados e conexão com pistas existentes.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES ('investigation-photos','investigation-photos',false,3145728,ARRAY['image/jpeg']::text[])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=3145728,allowed_mime_types=ARRAY['image/jpeg']::text[];

ALTER TABLE public.investigation_clues ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.investigation_clues DROP CONSTRAINT IF EXISTS investigation_photo_path_valid;
ALTER TABLE public.investigation_clues ADD CONSTRAINT investigation_photo_path_valid CHECK (
 storage_path IS NULL OR (
  category='imagem' AND image_url IS NULL
  AND storage_path ~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}[.]jpg$'
 )
);
CREATE UNIQUE INDEX IF NOT EXISTS investigation_clue_photo_storage_path_unique
 ON public.investigation_clues(storage_path) WHERE storage_path IS NOT NULL;

DROP POLICY IF EXISTS investigation_player_photo_insert ON public.investigation_clues;
CREATE POLICY investigation_player_photo_insert ON public.investigation_clues
 FOR INSERT TO authenticated
 WITH CHECK (
  created_by=(SELECT auth.uid()) AND visible=true AND revealed_at IS NOT NULL
  AND category='imagem' AND image_url IS NULL
  AND storage_path ~ ('^'||(SELECT auth.uid())::text||'/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}[.]jpg$')
  AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='jogador')
 );

DROP POLICY IF EXISTS investigation_photo_storage_upload ON storage.objects;
CREATE POLICY investigation_photo_storage_upload ON storage.objects
 FOR INSERT TO authenticated
 WITH CHECK (
  bucket_id='investigation-photos'
  AND name ~ ('^'||(SELECT auth.uid())::text||'/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}[.]jpg$')
  AND EXISTS(SELECT 1 FROM public.profiles p
   WHERE p.id=(SELECT auth.uid()) AND p.role IN ('jogador','mestre'))
 );

DROP POLICY IF EXISTS investigation_photo_storage_read ON storage.objects;
CREATE POLICY investigation_photo_storage_read ON storage.objects
 FOR SELECT TO authenticated
 USING (
  bucket_id='investigation-photos'
  AND EXISTS(SELECT 1 FROM public.investigation_clues c
   WHERE c.storage_path=storage.objects.name
     AND (c.visible OR (SELECT app_private.op_is_master())))
 );
