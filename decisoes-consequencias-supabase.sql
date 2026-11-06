-- Tempus Custodia: escolhas e efeitos futuros, privados para o mestre.
CREATE TABLE IF NOT EXISTS public.campaign_decisions (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 100),
 choice_text text NOT NULL CHECK(char_length(btrim(choice_text)) BETWEEN 1 AND 1200),
 participants text NOT NULL DEFAULT '' CHECK(char_length(participants)<=200),
 episode text NOT NULL DEFAULT '' CHECK(char_length(episode)<=100),
 impact text NOT NULL DEFAULT 'medio' CHECK(impact IN ('baixo','medio','alto','critico')),
 consequence_text text NOT NULL CHECK(char_length(btrim(consequence_text)) BETWEEN 1 AND 1800),
 trigger_condition text NOT NULL DEFAULT '' CHECK(char_length(trigger_condition)<=500),
 master_notes text NOT NULL DEFAULT '' CHECK(char_length(master_notes)<=1000),
 next_tool text NOT NULL DEFAULT 'nenhuma' CHECK(next_tool IN ('nenhuma','cenas','sussurros','npcs','enigmas','mural','personagens')),
 status text NOT NULL DEFAULT 'pendente' CHECK(status IN ('pendente','preparada','executada','arquivada')),
 created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 resolved_at timestamptz,
 CONSTRAINT campaign_decision_resolved_state CHECK (
  (status='executada' AND resolved_at IS NOT NULL) OR (status<>'executada' AND resolved_at IS NULL)
 )
);
CREATE INDEX IF NOT EXISTS campaign_decisions_master_status
 ON public.campaign_decisions(created_by,status,id DESC);
ALTER TABLE public.campaign_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS campaign_decisions_select_master ON public.campaign_decisions;
CREATE POLICY campaign_decisions_select_master ON public.campaign_decisions FOR SELECT TO authenticated
 USING ((SELECT app_private.op_is_master()) AND created_by=(SELECT auth.uid()));
DROP POLICY IF EXISTS campaign_decisions_insert_master ON public.campaign_decisions;
CREATE POLICY campaign_decisions_insert_master ON public.campaign_decisions FOR INSERT TO authenticated
 WITH CHECK ((SELECT app_private.op_is_master()) AND created_by=(SELECT auth.uid()));
DROP POLICY IF EXISTS campaign_decisions_update_master ON public.campaign_decisions;
CREATE POLICY campaign_decisions_update_master ON public.campaign_decisions FOR UPDATE TO authenticated
 USING ((SELECT app_private.op_is_master()) AND created_by=(SELECT auth.uid()))
 WITH CHECK ((SELECT app_private.op_is_master()) AND created_by=(SELECT auth.uid()));
REVOKE ALL ON public.campaign_decisions FROM public,anon,authenticated;
GRANT SELECT,INSERT ON public.campaign_decisions TO authenticated;
GRANT UPDATE(title,choice_text,participants,episode,impact,consequence_text,trigger_condition,
 master_notes,next_tool,status,updated_at,resolved_at) ON public.campaign_decisions TO authenticated;
GRANT USAGE,SELECT ON SEQUENCE public.campaign_decisions_id_seq TO authenticated;