-- Table privileges for public.drafts. New tables in this project get no
-- SELECT/INSERT/UPDATE/DELETE for the API roles by default, so the drafts
-- migration alone left signed-in users unable to read or write their drafts
-- (caught by the RLS test, "permission denied for table drafts").
--
-- Signed-in users get the four row operations; the RLS policies still limit
-- them to their own rows. Anonymous visitors get nothing. TRUNCATE ignores
-- RLS and would empty every user's drafts, so it is taken away from both API
-- roles, along with REFERENCES and TRIGGER, which the app never uses.

grant select, insert, update, delete on public.drafts to authenticated;

revoke truncate, references, trigger on public.drafts from anon, authenticated;
