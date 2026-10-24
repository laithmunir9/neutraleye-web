-- Removes table privileges the API roles never use. TRUNCATE ignores RLS and
-- would empty a table for every user at once; REFERENCES and TRIGGER are
-- unused. The website's API (PostgREST) cannot issue any of these, so this
-- closes nothing reachable today; it matches what drafts already has
-- (20261023000001_drafts_grants.sql). Row access is unchanged: RLS policies
-- and the SELECT/INSERT/UPDATE/DELETE grants stay as they are.

revoke truncate, references, trigger on public.analyses from anon, authenticated;
revoke truncate, references, trigger on public.waitlist from anon, authenticated;
revoke truncate, references, trigger on public._keepalive_heartbeat from anon, authenticated;
