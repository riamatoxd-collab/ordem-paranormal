-- SQL para executar UMA VEZ no SQL Editor do projeto Supabase.
-- NÃO configure senhas ou chaves secretas no repositório.
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
create or replace function public.op_is_master()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles p where p.id = (select auth.uid()) and p.role='mestre') $$;
revoke all on function public.op_is_master() from public;
grant execute on function public.op_is_master() to authenticated;
create or replace function public.op_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
 insert into public.profiles(id, display_name, role)
 values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),split_part(new.email,'@',1),'Jogador'),80),'jogador')
 on conflict (id) do nothing;
 insert into public.character_vaults(owner_id) values(new.id)
 on conflict (owner_id) do nothing;
 return new;
end;
$$;
drop trigger if exists op_user_created on auth.users;
create trigger op_user_created after insert on auth.users for each row execute function public.op_new_user();
alter table public.profiles enable row level security;
alter table public.character_vaults enable row level security;
drop policy if exists "profiles_self_or_master" on public.profiles;
create policy "profiles_self_or_master" on public.profiles for select to authenticated
using (id=(select auth.uid()) or public.op_is_master());
drop policy if exists "vault_owner_or_master_read" on public.character_vaults;
create policy "vault_owner_or_master_read" on public.character_vaults for select to authenticated
using (owner_id=(select auth.uid()) or public.op_is_master());
drop policy if exists "vault_owner_insert" on public.character_vaults;
create policy "vault_owner_insert" on public.character_vaults for insert to authenticated
with check (owner_id=(select auth.uid()));
drop policy if exists "vault_owner_update" on public.character_vaults;
create policy "vault_owner_update" on public.character_vaults for update to authenticated
using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
grant select on public.profiles to authenticated;
grant select, insert, update on public.character_vaults to authenticated;
-- IMPORTANTE: nenhum jogador pode se promover a mestre pelo navegador.
-- Depois de cadastrar SUA conta, procure o ID dela em Authentication > Users
-- e execute separadamente (substitua o UUID de exemplo):
-- update public.profiles set role='mestre' where id='COLE-AQUI-SEU-UUID'::uuid;
-- O PIN visual do Painel do Mestre não concede acesso no banco.
