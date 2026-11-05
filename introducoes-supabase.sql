-- Tempus Custodia — apresentações públicas dos personagens.
-- A implantação foi aplicada ao Supabase "eita" em 2026-11-05.
-- Requer app_private.op_is_master() do supabase-schema.sql.
create table if not exists public.character_introductions (
 id bigint generated always as identity primary key,
 name text not null check (char_length(name) between 1 and 80),
 subtitle text not null default '' check (char_length(subtitle) <= 100),
 quote text not null default '' check (char_length(quote) <= 220),
 description text not null default '' check (char_length(description) <= 340),
 chapter text not null default '' check (char_length(chapter) <= 80),
 kind text not null default 'npc' check (kind in ('npc','samurai','jornalista','outro')),
 accent text not null default '#ba9575' check (accent ~ '^#[0-9a-fA-F]{6}$'),
 portrait_url text check (portrait_url is null or (char_length(portrait_url) <= 500 and portrait_url ~ '^https://')),
 created_by uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.character_introductions enable row level security;
drop policy if exists intro_read_signed_in on public.character_introductions;
create policy intro_read_signed_in on public.character_introductions
for select to authenticated using (true);
drop policy if exists intro_master_publish on public.character_introductions;
create policy intro_master_publish on public.character_introductions
for insert to authenticated
with check (created_by=(select auth.uid()) and (select app_private.op_is_master()));
revoke all on public.character_introductions from public, anon, authenticated;
grant select, insert on public.character_introductions to authenticated;
grant usage, select on sequence public.character_introductions_id_seq to authenticated;
