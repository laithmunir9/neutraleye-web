-- Keep analysis usage accounting server-controlled. RLS ownership alone is
-- insufficient because a signed-in client could lower its own count.

DROP POLICY IF EXISTS "insert_own" ON public.daily_usage;
DROP POLICY IF EXISTS "update_own" ON public.daily_usage;
DROP POLICY IF EXISTS "daily_usage_insert_own" ON public.daily_usage;
DROP POLICY IF EXISTS "daily_usage_update_own" ON public.daily_usage;
-- Production also grants TRUNCATE and TRIGGER to browser roles. Remove every
-- direct table privilege, then return only the read needed for the usage UI.
REVOKE ALL PRIVILEGES ON TABLE public.daily_usage FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.daily_usage TO authenticated;

