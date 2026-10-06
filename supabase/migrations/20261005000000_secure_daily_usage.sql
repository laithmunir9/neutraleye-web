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

-- This narrowly scoped RPC is intentionally callable by authenticated users.
-- It derives the account from the JWT and can only increase today's count.
CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  account_id uuid := (SELECT auth.uid());
  today date := (now() AT TIME ZONE 'UTC')::date;
  new_count integer;
BEGIN
  IF account_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '28000';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 THEN
    RAISE EXCEPTION 'Invalid daily limit' USING ERRCODE = '22023';
  END IF;

  -- Serialize first-insert and later increments for this account and date.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(account_id::text || ':' || today::text, 0)
  );

  SELECT count INTO new_count
  FROM public.daily_usage
  WHERE user_id = account_id AND usage_date = today;

  IF FOUND THEN
    IF new_count >= p_limit THEN
      RAISE EXCEPTION 'Daily analysis limit reached' USING ERRCODE = 'P4290';
    END IF;
    UPDATE public.daily_usage
    SET count = count + 1
    WHERE user_id = account_id AND usage_date = today
    RETURNING count INTO new_count;
  ELSE
    INSERT INTO public.daily_usage (user_id, usage_date, count)
    VALUES (account_id, today, 1)
    RETURNING count INTO new_count;
  END IF;

  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_daily_usage(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(integer) TO authenticated;
