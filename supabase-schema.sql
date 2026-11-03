-- Schema seguro implantado no projeto Supabase "eita".
-- Este arquivo serve para replicar a estrutura em OUTRO projeto vazio.
-- Nunca inclua chaves secretas ou senhas no GitHub.
create schema if not exists app_private;
revoke all on schema app_private from public, anon;
grant usage on schema app_private to authenticated;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check (char_length(display_name) between 2 and 80),
 role text not null default 'jogador' check (role in ('jogador','mestre')),
 created_at timestamptz not null default now()
);
create table if not exists public.character_vaults (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 characters jsonb not null default '[]'::jsonb check (jsonb_typeof(characters)='array'),
 history jsonb not null default '[]'::jsonb check (jsonb_typeof(history)='array'),
 updated_at timestamptz not null default now()
);
create or replace function app_private.op_is_master()
 returns boolean language sql stable security definer set search_path = ''
as $$
 select exists (select 1 from public.profiles p
  where p.id=(select auth.uid()) and p.role='mestre');
$$;
revoke all on function app_private.op_is_master() from public, anon;
grant execute on function app_private.op_is_master() to authenticated;
create or replace function app_private.op_new_user()
 returns trigger language plpgsql security definer set search_path = ''
as $$
declare nickname text;
begin
 nickname := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'),''),
  nullif(split_part(coalesce(new.email,''),'@',1),''),'Jogador');
 if char_length(nickname)<2 then nickname:='Jogador'; end if;
 insert into public.profiles(id,display_name,role)
 values(new.id,left(nickname,80),'jogador') on conflict(id) do nothing;
 insert into public.character_vaults(owner_id) values(new.id)
 on conflict(owner_id) do nothing;
 return new;
end;
$$;
revoke all on function app_private.op_new_user() from public, anon, authenticated;
drop trigger if exists op_user_created on auth.users;
create trigger op_user_created after insert on auth.users
 for each row execute function app_private.op_new_user();
alter table public.profiles enable row level security;
alter table public.character_vaults enable row level security;
drop policy if exists "profiles_self_or_master" on public.profiles;
create policy "profiles_self_or_master" on public.profiles for select to authenticated
using (id=(select auth.uid()) or (select app_private.op_is_master()));
drop policy if exists "vault_owner_or_master_read" on public.character_vaults;
create policy "vault_owner_or_master_read" on public.character_vaults for select to authenticated
using (owner_id=(select auth.uid()) or (select app_private.op_is_master()));
drop policy if exists "vault_owner_insert" on public.character_vaults;
create policy "vault_owner_insert" on public.character_vaults for insert to authenticated
with check (owner_id=(select auth.uid()));
drop policy if exists "vault_owner_update" on public.character_vaults;
create policy "vault_owner_update" on public.character_vaults for update to authenticated
using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
revoke all on public.profiles from anon,authenticated;
revoke all on public.character_vaults from anon,authenticated;
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select,insert,update on public.character_vaults to authenticated;
-- Após cadastro e verificação da conta, atribua mestre somente ao usuário autorizado:
-- update public.profiles set role='mestre' where id='UUID_VERIFICADO'::uuid;
