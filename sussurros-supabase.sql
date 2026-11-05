-- Tempus Custodia — Sistema de Sussurros, novembro de 2026.
-- Requer auth.users, public.profiles e app_private.op_is_master() existentes.
create or replace function app_private.whisper_is_master(p_user uuid)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(select 1 from public.profiles p where p.id=p_user and p.role='mestre');
$$;
revoke all on function app_private.whisper_is_master(uuid) from public,anon;
grant execute on function app_private.whisper_is_master(uuid) to authenticated;

create table if not exists public.private_whispers (
 id bigint generated always as identity primary key,
 sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade,
 title text not null default 'Um sussurro' check (char_length(title) between 1 and 90),
 body text not null check (char_length(body) between 1 and 1500),
 kind text not null default 'sussurro' check (kind in ('sussurro','pista','pressagio')),
 created_at timestamptz not null default now(),
 read_at timestamptz,
 constraint whispers_different_users check (sender_id<>recipient_id)
);
create index if not exists whispers_recipient_newest on public.private_whispers(recipient_id,id desc);
create index if not exists whispers_sender_newest on public.private_whispers(sender_id,id desc);
create index if not exists whispers_unread on public.private_whispers(recipient_id,id desc) where read_at is null;
alter table public.private_whispers enable row level security;
drop policy if exists whisper_participants_read on public.private_whispers;
create policy whisper_participants_read on public.private_whispers
 for select to authenticated
 using (sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
drop policy if exists whisper_allowed_sender on public.private_whispers;
create policy whisper_allowed_sender on public.private_whispers
 for insert to authenticated
 with check (
  sender_id=(select auth.uid()) and read_at is null
  and (
   ((select app_private.op_is_master()) and exists (
    select 1 from public.profiles target
    where target.id=recipient_id and target.role='jogador'
   ))
   or
   (exists(
    select 1 from public.profiles sender
    where sender.id=(select auth.uid()) and sender.role='jogador'
   ) and app_private.whisper_is_master(recipient_id))
  )
 );
drop policy if exists whisper_recipient_mark_read on public.private_whispers;
create policy whisper_recipient_mark_read on public.private_whispers
 for update to authenticated
 using (recipient_id=(select auth.uid()) and read_at is null)
 with check (recipient_id=(select auth.uid()) and read_at is not null);
revoke all on public.private_whispers from public,anon,authenticated;
grant select,insert on public.private_whispers to authenticated;
grant update(read_at) on public.private_whispers to authenticated;
grant usage,select on sequence public.private_whispers_id_seq to authenticated;
