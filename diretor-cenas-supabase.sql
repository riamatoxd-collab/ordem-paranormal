-- TEMPUS CUSTODIA — Diretor de Cenas (implantado em 2026-11-05).
-- Execute após supabase-schema.sql, que instala app_private.op_is_master().
-- Mestres publicam e encerram. Usuários autenticados leem. Jogadores votam uma vez.
create table if not exists public.cinematic_scenes (
 id bigint generated always as identity primary key,
 title text not null check (char_length(title) between 1 and 90),
 subtitle text not null default '' check (char_length(subtitle)<=110),
 chapter text not null default '' check (char_length(chapter)<=90),
 narration text not null default '' check (char_length(narration)<=1800),
 accent text not null default '#bb9b79' check (accent~'^#[0-9a-fA-F]{6}$'),
 image_url text check (image_url is null or (char_length(image_url)<=500 and image_url~'^https://')),
 audio_url text check (audio_url is null or (char_length(audio_url)<=500 and audio_url~'^https://')),
 choices jsonb not null default '[]'::jsonb
  check (jsonb_typeof(choices)='array' and jsonb_array_length(choices)<=4),
 status text not null default 'active' check (status in ('active','closed')),
 created_by uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 closed_at timestamptz
);
create unique index if not exists cinematic_only_one_active
 on public.cinematic_scenes(status) where status='active';
create index if not exists cinematic_scenes_recent on public.cinematic_scenes(id desc);
alter table public.cinematic_scenes enable row level security;
drop policy if exists cinematic_scenes_authenticated_read on public.cinematic_scenes;
create policy cinematic_scenes_authenticated_read on public.cinematic_scenes
 for select to authenticated using (true);
drop policy if exists cinematic_scenes_master_create on public.cinematic_scenes;
create policy cinematic_scenes_master_create on public.cinematic_scenes
 for insert to authenticated
 with check (created_by=(select auth.uid()) and (select app_private.op_is_master())
  and status='active' and closed_at is null);
drop policy if exists cinematic_scenes_master_close on public.cinematic_scenes;
create policy cinematic_scenes_master_close on public.cinematic_scenes
 for update to authenticated
 using ((select app_private.op_is_master()) and status='active')
 with check ((select app_private.op_is_master()) and status='closed' and closed_at is not null);
revoke all on public.cinematic_scenes from public,anon,authenticated;
grant select,insert on public.cinematic_scenes to authenticated;
grant update(status,closed_at) on public.cinematic_scenes to authenticated;
grant usage,select on sequence public.cinematic_scenes_id_seq to authenticated;

create table if not exists public.cinematic_scene_votes (
 id bigint generated always as identity primary key,
 scene_id bigint not null references public.cinematic_scenes(id) on delete cascade,
 player_id uuid not null references auth.users(id) on delete cascade,
 choice_index integer not null check (choice_index between 0 and 3),
 created_at timestamptz not null default now(),
 unique(scene_id,player_id)
);
create index if not exists cinematic_votes_by_scene on public.cinematic_scene_votes(scene_id);
alter table public.cinematic_scene_votes enable row level security;
drop policy if exists cinematic_votes_owner_master_read on public.cinematic_scene_votes;
create policy cinematic_votes_owner_master_read on public.cinematic_scene_votes
 for select to authenticated
 using (player_id=(select auth.uid()) or (select app_private.op_is_master()));
drop policy if exists cinematic_votes_owner_insert on public.cinematic_scene_votes;
create policy cinematic_votes_owner_insert on public.cinematic_scene_votes
 for insert to authenticated
 with check (player_id=(select auth.uid())
  and exists (select 1 from public.cinematic_scenes s
              where s.id=scene_id and s.status='active'
                and choice_index<jsonb_array_length(s.choices)));
revoke all on public.cinematic_scene_votes from public,anon,authenticated;
grant select,insert on public.cinematic_scene_votes to authenticated;
grant usage,select on sequence public.cinematic_scene_votes_id_seq to authenticated;
