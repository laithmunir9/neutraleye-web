-- The previous public.keepalive() did no table I/O (just `select now()`), so it
-- kept succeeding every day (verified in edge_logs) while Supabase's own
-- inactivity scanner still flagged the project for pausing -- confirmed via the
-- "Your Supabase Project is going to be paused" email received 2026-09-16, well
-- after the daily cron had already been running successfully since 2026-09-10.
-- A pure computation with no reads/writes apparently doesn't count as activity;
-- a real row write should.
create table if not exists public._keepalive_heartbeat (
  id boolean primary key default true,
  pinged_at timestamptz not null default now(),
  constraint keepalive_heartbeat_singleton check (id)
);

alter table public._keepalive_heartbeat enable row level security;

insert into public._keepalive_heartbeat (id)
values (true)
on conflict (id) do nothing;

drop function if exists public.keepalive();

create function public.keepalive()
returns void
language sql
security definer
set search_path = ''
as $$
  update public._keepalive_heartbeat set pinged_at = now() where id = true;
$$;

grant execute on function public.keepalive() to anon, authenticated;
