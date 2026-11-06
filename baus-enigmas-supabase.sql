-- TEMPUS CUSTODIA • Baús com senha de quatro dígitos
-- Executar após enigmas-mural-supabase.sql. Alteração já aplicada ao projeto em 2026-11-05.

ALTER TABLE public.rpg_puzzles ADD COLUMN IF NOT EXISTS puzzle_kind text NOT NULL DEFAULT 'text';
ALTER TABLE public.rpg_puzzles DROP CONSTRAINT IF EXISTS rpg_puzzles_kind_check;
ALTER TABLE public.rpg_puzzles ADD CONSTRAINT rpg_puzzles_kind_check
 CHECK (puzzle_kind IN ('text','chest'));

CREATE TABLE IF NOT EXISTS public.rpg_chest_contents (
 puzzle_id bigint PRIMARY KEY REFERENCES public.rpg_puzzles(id) ON DELETE CASCADE,
 loot_title text NOT NULL CHECK (char_length(loot_title) BETWEEN 1 AND 110),
 contents text NOT NULL CHECK (char_length(contents) BETWEEN 1 AND 1800),
 image_url text CHECK (image_url IS NULL OR (char_length(image_url) <= 500 AND image_url ~ '^https://')),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rpg_chest_contents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rpg_chest_contents_read ON public.rpg_chest_contents;
CREATE POLICY rpg_chest_contents_read ON public.rpg_chest_contents
 FOR SELECT TO authenticated
 USING ((SELECT app_private.op_is_master())
 OR EXISTS (SELECT 1 FROM public.rpg_puzzles p WHERE p.id=puzzle_id AND p.puzzle_kind='chest' AND p.status='solved'));
DROP POLICY IF EXISTS rpg_chest_contents_create ON public.rpg_chest_contents;
CREATE POLICY rpg_chest_contents_create ON public.rpg_chest_contents
 FOR INSERT TO authenticated
 WITH CHECK ((SELECT app_private.op_is_master()) AND EXISTS
 (SELECT 1 FROM public.rpg_puzzles p WHERE p.id=puzzle_id AND p.puzzle_kind='chest'
  AND p.status='draft' AND p.created_by=(SELECT auth.uid())));
REVOKE ALL ON public.rpg_chest_contents FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.rpg_chest_contents TO authenticated;

CREATE OR REPLACE FUNCTION app_private.guard_chest_activation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
 IF NEW.puzzle_kind='chest' AND NEW.status='active' AND
    (TG_OP='INSERT' OR OLD.status IS DISTINCT FROM 'active') THEN
  IF NOT EXISTS (
   SELECT 1 FROM public.rpg_puzzle_answers a
   WHERE a.puzzle_id=NEW.id AND a.answer_value~'^[0-9]{4}$'
  ) THEN
   RAISE EXCEPTION 'Configure uma senha de exatamente quatro números antes de publicar o baú.' USING errcode='23514';
  END IF;
  IF NOT EXISTS (
   SELECT 1 FROM public.rpg_chest_contents c WHERE c.puzzle_id=NEW.id
  ) THEN
   RAISE EXCEPTION 'Adicione o conteúdo do baú antes de publicá-lo.' USING errcode='23514';
  END IF;
 END IF;
 RETURN NEW;
END;
$function$
;
REVOKE ALL ON FUNCTION app_private.guard_chest_activation() FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS trg_guard_chest_activation ON public.rpg_puzzles;
CREATE TRIGGER trg_guard_chest_activation BEFORE UPDATE ON public.rpg_puzzles
 FOR EACH ROW EXECUTE FUNCTION app_private.guard_chest_activation();

CREATE OR REPLACE FUNCTION app_private.check_rpg_puzzle_attempt()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_puzzle public.rpg_puzzles%rowtype;
 v_answer text;
 v_tries integer;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NEW.player_id IS DISTINCT FROM (SELECT auth.uid()) THEN
  RAISE EXCEPTION 'Tentativa não autorizada.' USING errcode='42501';
 END IF;
 IF (SELECT app_private.op_is_master()) THEN
  RAISE EXCEPTION 'Apenas jogadores respondem os enigmas.' USING errcode='42501';
 END IF;
 SELECT * INTO v_puzzle FROM public.rpg_puzzles WHERE id=NEW.puzzle_id FOR UPDATE;
 IF NOT FOUND OR v_puzzle.status<>'active' THEN
  RAISE EXCEPTION 'Este enigma não está aceitando respostas.' USING errcode='23514';
 END IF;
 IF v_puzzle.puzzle_kind='chest' AND NEW.guess !~ '^[0-9]{4}$' THEN
  RAISE EXCEPTION 'Informe exatamente quatro dígitos.' USING errcode='23514';
 END IF;
 SELECT count(*) INTO v_tries FROM public.rpg_puzzle_attempts
  WHERE puzzle_id=NEW.puzzle_id AND player_id=NEW.player_id;
 IF v_tries>=8 THEN
  RAISE EXCEPTION 'Limite de 8 tentativas atingido. Peça ajuda ao mestre.' USING errcode='23514';
 END IF;
 SELECT answer_value INTO v_answer FROM public.rpg_puzzle_answers WHERE puzzle_id=NEW.puzzle_id;
 IF v_answer IS NULL THEN
  RAISE EXCEPTION 'O mestre ainda não configurou a resposta.' USING errcode='23514';
 END IF;
 NEW.correct:=lower(btrim(NEW.guess))=lower(btrim(v_answer));
 IF NEW.correct THEN
  UPDATE public.rpg_puzzles SET status='solved',solved_at=now() WHERE id=NEW.puzzle_id;
  IF v_puzzle.unlock_clue_id IS NOT NULL THEN
   UPDATE public.investigation_clues SET visible=true,revealed_at=coalesce(revealed_at,now())
    WHERE id=v_puzzle.unlock_clue_id;
  END IF;
 END IF;
 RETURN NEW;
END;
$function$
;
REVOKE ALL ON FUNCTION app_private.check_rpg_puzzle_attempt() FROM public,anon,authenticated;
-- O trigger trg_check_rpg_puzzle_attempt já existe desde enigmas-mural-supabase.sql.

CREATE OR REPLACE FUNCTION public.create_chest_puzzle(p_title text, p_prompt text, p_hint text, p_code text, p_loot_title text, p_contents text, p_image_url text DEFAULT NULL::text, p_unlock_clue_id bigint DEFAULT NULL::bigint, p_publish boolean DEFAULT true)
 RETURNS bigint
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
 v_id bigint;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT (SELECT app_private.op_is_master()) THEN
  RAISE EXCEPTION 'Somente o mestre pode criar baús.' USING errcode='42501';
 END IF;
 IF p_code IS NULL OR p_code !~ '^[0-9]{4}$' THEN
  RAISE EXCEPTION 'A senha do baú deve conter exatamente quatro dígitos.' USING errcode='23514';
 END IF;
 IF p_title IS NULL OR char_length(btrim(p_title)) NOT BETWEEN 1 AND 100 OR
    p_prompt IS NULL OR char_length(btrim(p_prompt)) NOT BETWEEN 1 AND 1200 OR
    p_loot_title IS NULL OR char_length(btrim(p_loot_title)) NOT BETWEEN 1 AND 110 OR
    p_contents IS NULL OR char_length(btrim(p_contents)) NOT BETWEEN 1 AND 1800 THEN
  RAISE EXCEPTION 'Preencha título, desafio e conteúdo do baú dentro dos limites.' USING errcode='23514';
 END IF;
 IF char_length(coalesce(p_hint,''))>420 THEN
  RAISE EXCEPTION 'Dica muito longa.' USING errcode='23514';
 END IF;
 IF p_image_url IS NOT NULL AND (p_image_url !~ '^https://' OR char_length(p_image_url)>500) THEN
  RAISE EXCEPTION 'A imagem do baú precisa usar HTTPS.' USING errcode='23514';
 END IF;
 INSERT INTO public.rpg_puzzles(title,prompt,hint,theme,status,puzzle_kind,unlock_clue_id,created_by)
 VALUES(btrim(p_title),btrim(p_prompt),coalesce(p_hint,''),'simbolos','draft','chest',p_unlock_clue_id,(SELECT auth.uid()))
 RETURNING id INTO v_id;
 INSERT INTO public.rpg_puzzle_answers(puzzle_id,answer_value) VALUES(v_id,p_code);
 INSERT INTO public.rpg_chest_contents(puzzle_id,loot_title,contents,image_url)
 VALUES(v_id,btrim(p_loot_title),btrim(p_contents),p_image_url);
 IF p_publish THEN
  UPDATE public.rpg_puzzles SET status='active' WHERE id=v_id;
 END IF;
 RETURN v_id;
END;
$function$
;
REVOKE ALL ON FUNCTION public.create_chest_puzzle(text,text,text,text,text,text,text,bigint,boolean) FROM public,anon;
GRANT EXECUTE ON FUNCTION public.create_chest_puzzle(text,text,text,text,text,text,text,bigint,boolean) TO authenticated;
NOTIFY pgrst, 'reload schema';
