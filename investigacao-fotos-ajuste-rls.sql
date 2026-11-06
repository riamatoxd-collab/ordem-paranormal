-- Tornar explícitas as validações da foto do jogador na política de INSERT.
ALTER POLICY investigation_player_photo_insert ON public.investigation_clues WITH CHECK (
 created_by=(select auth.uid())
 AND visible=true
 AND category='imagem'
 AND image_url IS NULL
 AND revealed_at IS NOT NULL
 AND storage_path ~ ('^'||(select auth.uid())::text||'/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}[.]jpg$')
 AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=(select auth.uid()) AND p.role='jogador')
);