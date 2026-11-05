-- Aplicado em 2026-11-05 • migration 20261105225116
-- Tempus Custodia: enigma com resposta privada e mural de investigação compartilhado.
-- Pistas ocultas não são retornadas a jogadores; soluções nunca ficam em tabelas públicas legíveis.
CREATE TABLE IF NOT EXISTS public.investigation_clues (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
 details text NOT NULL DEFAULT '' CHECK (char_length(details)<=1500),
 category text NOT NULL DEFAULT 'pista' CHECK(category IN ('pista','documento','local','testemunho','imagem')),
 image_url text CHECK(image_url IS NULL OR (char_length(image_url)<=500 AND image_url~'^https://')),
 visible boolean NOT NULL DEFAULT false,
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 revealed_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_investigation_clues_visible ON public.investigation_clues(visible,id DESC);
ALTER TABLE public.investigation_clues ENABLE ROW LEVEL SECURITY;
CREATE POLICY investigation_clues_read ON public.investigation_clues FOR SELECT TO authenticated
 USING(visible OR (SELECT app_private.op_is_master()));
CREATE POLICY investigation_clues_master_insert ON public.investigation_clues FOR INSERT TO authenticated
 WITH CHECK ((SELECT app_private.op_is_master()) AND created_by=(SELECT auth.uid()) AND visible=false);
CREATE POLICY investigation_clues_master_visibility ON public.investigation_clues FOR UPDATE TO authenticated
 USING((SELECT app_private.op_is_master())) WITH CHECK((SELECT app_private.op_is_master()));
REVOKE ALL ON public.investigation_clues FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.investigation_clues TO authenticated;
GRANT UPDATE(visible,revealed_at) ON public.investigation_clues TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.investigation_clues_id_seq TO authenticated;

CREATE TABLE IF NOT EXISTS public.investigation_links (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 clue_a bigint NOT NULL REFERENCES public.investigation_clues(id) ON DELETE CASCADE,
 clue_b bigint NOT NULL REFERENCES public.investigation_clues(id) ON DELETE CASCADE,
 insight text NOT NULL DEFAULT '' CHECK (char_length(insight)<=240),
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT investigation_link_order CHECK(clue_a<clue_b),
 CONSTRAINT investigation_link_unique UNIQUE(clue_a,clue_b)
);
CREATE INDEX IF NOT EXISTS idx_investigation_links_by_clue_a ON public.investigation_links(clue_a);
CREATE INDEX IF NOT EXISTS idx_investigation_links_by_clue_b ON public.investigation_links(clue_b);
ALTER TABLE public.investigation_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY investigation_links_read ON public.investigation_links FOR SELECT TO authenticated
 USING(
  (SELECT app_private.op_is_master())
  OR (EXISTS(SELECT 1 FROM public.investigation_clues c WHERE c.id=clue_a AND c.visible)
      AND EXISTS(SELECT 1 FROM public.investigation_clues c WHERE c.id=clue_b AND c.visible))
 );
CREATE POLICY investigation_links_add ON public.investigation_links FOR INSERT TO authenticated
 WITH CHECK(
  created_by=(SELECT auth.uid()) AND (
   (SELECT app_private.op_is_master())
   OR (EXISTS(SELECT 1 FROM public.investigation_clues c WHERE c.id=clue_a AND c.visible)
       AND EXISTS(SELECT 1 FROM public.investigation_clues c WHERE c.id=clue_b AND c.visible))
  )
 );
REVOKE ALL ON public.investigation_links FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.investigation_links TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.investigation_links_id_seq TO authenticated;

CREATE TABLE IF NOT EXISTS public.investigation_notes (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 clue_id bigint NOT NULL REFERENCES public.investigation_clues(id) ON DELETE CASCADE,
 body text NOT NULL CHECK(char_length(body) BETWEEN 1 AND 500),
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_investigation_notes_clue ON public.investigation_notes(clue_id,id DESC);
ALTER TABLE public.investigation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY investigation_notes_read ON public.investigation_notes FOR SELECT TO authenticated
 USING((SELECT app_private.op_is_master())
   OR EXISTS(SELECT 1 FROM public.investigation_clues c WHERE c.id=clue_id AND c.visible));
CREATE POLICY investigation_notes_add ON public.investigation_notes FOR INSERT TO authenticated
 WITH CHECK(created_by=(SELECT auth.uid()) AND (
  (SELECT app_private.op_is_master())
  OR EXISTS(SELECT 1 FROM public.investigation_clues c WHERE c.id=clue_id AND c.visible)
 ));
REVOKE ALL ON public.investigation_notes FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.investigation_notes TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.investigation_notes_id_seq TO authenticated;

CREATE TABLE IF NOT EXISTS public.rpg_puzzles (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 title text NOT NULL CHECK(char_length(title) BETWEEN 1 AND 100),
 prompt text NOT NULL CHECK(char_length(prompt) BETWEEN 1 AND 1200),
 hint text NOT NULL DEFAULT '' CHECK(char_length(hint)<=420),
 theme text NOT NULL DEFAULT 'conhecimento' CHECK(theme IN ('conhecimento','medo','tempo','simbolos')),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','solved','closed')),
 unlock_clue_id bigint REFERENCES public.investigation_clues(id) ON DELETE SET NULL,
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 solved_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_rpg_puzzles_recent ON public.rpg_puzzles(id DESC);
ALTER TABLE public.rpg_puzzles ENABLE ROW LEVEL SECURITY;
CREATE POLICY rpg_puzzles_read ON public.rpg_puzzles FOR SELECT TO authenticated
 USING(status<>'draft' OR (SELECT app_private.op_is_master()));
CREATE POLICY rpg_puzzles_master_create ON public.rpg_puzzles FOR INSERT TO authenticated
 WITH CHECK((SELECT app_private.op_is_master()) AND created_by=(SELECT auth.uid())
  AND status='draft' AND solved_at IS NULL);
CREATE POLICY rpg_puzzles_master_status ON public.rpg_puzzles FOR UPDATE TO authenticated
 USING((SELECT app_private.op_is_master())) WITH CHECK((SELECT app_private.op_is_master()));
REVOKE ALL ON public.rpg_puzzles FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.rpg_puzzles TO authenticated;
GRANT UPDATE(status,solved_at) ON public.rpg_puzzles TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.rpg_puzzles_id_seq TO authenticated;

CREATE TABLE IF NOT EXISTS public.rpg_puzzle_answers (
 puzzle_id bigint PRIMARY KEY REFERENCES public.rpg_puzzles(id) ON DELETE CASCADE,
 answer_value text NOT NULL CHECK(char_length(btrim(answer_value)) BETWEEN 1 AND 70),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rpg_puzzle_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY rpg_answers_master_only_read ON public.rpg_puzzle_answers FOR SELECT TO authenticated
 USING((SELECT app_private.op_is_master()));
CREATE POLICY rpg_answers_master_only_create ON public.rpg_puzzle_answers FOR INSERT TO authenticated
 WITH CHECK((SELECT app_private.op_is_master()) AND EXISTS(
  SELECT 1 FROM public.rpg_puzzles p WHERE p.id=puzzle_id AND p.status='draft' AND p.created_by=(SELECT auth.uid())
 ));
REVOKE ALL ON public.rpg_puzzle_answers FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.rpg_puzzle_answers TO authenticated;

CREATE TABLE IF NOT EXISTS public.rpg_puzzle_attempts (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 puzzle_id bigint NOT NULL REFERENCES public.rpg_puzzles(id) ON DELETE CASCADE,
 player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 guess text NOT NULL CHECK(char_length(btrim(guess)) BETWEEN 1 AND 70),
 correct boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rpg_attempts_player_puzzle ON public.rpg_puzzle_attempts(puzzle_id,player_id,id DESC);
ALTER TABLE public.rpg_puzzle_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY rpg_attempts_read ON public.rpg_puzzle_attempts FOR SELECT TO authenticated
 USING(player_id=(SELECT auth.uid()) OR (SELECT app_private.op_is_master()));
CREATE POLICY rpg_attempts_player_submit ON public.rpg_puzzle_attempts FOR INSERT TO authenticated
 WITH CHECK(player_id=(SELECT auth.uid()) AND NOT (SELECT app_private.op_is_master()));
REVOKE ALL ON public.rpg_puzzle_attempts FROM public,anon,authenticated;
GRANT SELECT ON public.rpg_puzzle_attempts TO authenticated;
GRANT INSERT(puzzle_id,player_id,guess) ON public.rpg_puzzle_attempts TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.rpg_puzzle_attempts_id_seq TO authenticated;

-- Trigger privado: a solução não entra no navegador nem na API de leitura.
CREATE OR REPLACE FUNCTION app_private.check_rpg_puzzle_attempt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
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
 -- Evita corrida e força no máximo 8 tentativas para cada conta.
 SELECT * INTO v_puzzle FROM public.rpg_puzzles WHERE id=NEW.puzzle_id FOR UPDATE;
 IF NOT FOUND OR v_puzzle.status<>'active' THEN
  RAISE EXCEPTION 'Este enigma não está aceitando respostas.' USING errcode='23514';
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
$$;
REVOKE ALL ON FUNCTION app_private.check_rpg_puzzle_attempt() FROM public,anon,authenticated;
DROP TRIGGER IF EXISTS trg_check_rpg_puzzle_attempt ON public.rpg_puzzle_attempts;
CREATE TRIGGER trg_check_rpg_puzzle_attempt BEFORE INSERT ON public.rpg_puzzle_attempts
 FOR EACH ROW EXECUTE FUNCTION app_private.check_rpg_puzzle_attempt();
