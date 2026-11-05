-- Tempus Custodia — apresentações do mestre.
-- As apresentações de NPCs/jornalistas são visíveis para contas autenticadas.
-- As de samurais ficam restritas ao mestre e à conta atualmente atribuída à ficha.
-- Requer: app_private.op_is_master() e public.samurai_slots já criados.
create table if not exists public.character_introductions (
 id bigint generated always as identity primary key,
 name text not null check (char_length(name) between 1 and 80),
 subtitle text not null default '' check (char_length(subtitle) <= 100),
 quote text not null default '' check (char_length(quote) <= 220),
 description text not null default '' check (char_length(description) <= 340),
 chapter text not null default '' check (char_length(chapter) <= 80),
 kind text not null default 'npc' check (kind in ('npc','samurai','jornalista','outro')),
 samurai_slug text references public.samurai_slots(slug),
 accent text not null default '#ba9575' check (accent ~ '^#[0-9a-fA-F]{6}$'),
 portrait_url text check (portrait_url is null or (char_length(portrait_url) <= 500 and portrait_url ~ '^https://')),
 created_by uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 constraint intro_samurai_visibility_consistency check (
   (kind='samurai' and samurai_slug is not null)
   or (kind <> 'samurai' and samurai_slug is null)
 )
);
alter table public.character_introductions enable row level security;
drop policy if exists intro_read_signed_in on public.character_introductions;
create policy intro_read_signed_in on public.character_introductions
for select to authenticated
using (
 kind <> 'samurai'
 or (select app_private.op_is_master())
 or exists (
  select 1 from public.samurai_slots s
  where s.slug=samurai_slug and s.assigned_to=(select auth.uid())
 )
);
drop policy if exists intro_master_publish on public.character_introductions;
create policy intro_master_publish on public.character_introductions
for insert to authenticated
with check (
 created_by=(select auth.uid())
 and (select app_private.op_is_master())
 and (
  kind <> 'samurai'
  or exists (
   select 1 from public.samurai_slots s
   where s.slug=samurai_slug and s.assigned_to is not null
  )
 )
);
revoke all on public.character_introductions from public, anon, authenticated;
grant select, insert on public.character_introductions to authenticated;
grant usage, select on sequence public.character_introductions_id_seq to authenticated;
