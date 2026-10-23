-- Write mode drafts: one row per draft, private to the person who wrote it.
-- The app reads and writes these only through the signed-in user's own
-- session (publishable key, no service role), so RLS below is the whole
-- access control.

create table public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default 'Untitled',
  kind text not null default 'essay' check (kind in ('essay', 'opinion', 'news')),
  target text,
  topic text,
  content jsonb,
  content_text text not null default '',
  word_count int not null default 0,
  last_review jsonb,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drafts enable row level security;

-- (select auth.uid()) rather than auth.uid(): evaluated once per query instead
-- of once per row, which is what Supabase's performance advisor asks for.
create policy "drafts_select_own" on public.drafts
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "drafts_insert_own" on public.drafts
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "drafts_update_own" on public.drafts
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "drafts_delete_own" on public.drafts
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- The drafts rail lists a user's drafts newest first.
create index drafts_user_id_updated_at_idx on public.drafts (user_id, updated_at desc);

-- Keeps updated_at true on every update, so the rail's order does not depend
-- on each client remembering to set it.
create function public.drafts_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger drafts_set_updated_at
  before update on public.drafts
  for each row
  execute function public.drafts_set_updated_at();
