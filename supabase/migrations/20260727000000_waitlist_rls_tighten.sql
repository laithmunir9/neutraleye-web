-- Backfill: public.waitlist was created out-of-band (directly against the
-- live database) and was never tracked in a migration. This documents the
-- live schema so local dev / `supabase db reset` can reproduce it.
CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Reads were already closed correctly; recreate idempotently for a clean db reset.
DROP POLICY IF EXISTS "no_public_reads_waitlist" ON public.waitlist;
CREATE POLICY "no_public_reads_waitlist" ON public.waitlist
  FOR SELECT TO public USING (false);

-- ── Close the open INSERT policy ────────────────────────────────────────────
-- WITH CHECK (true) let any unauthenticated caller insert arbitrary rows via
-- the public anon key (flagged repeatedly by the weekly ops-check / Supabase
-- advisors as rls_policy_always_true). Drop it and leave no INSERT policy in
-- its place, so RLS default-denies direct table inserts for anon/public.
DROP POLICY IF EXISTS "public_insert_waitlist" ON public.waitlist;

-- ── Narrow, validated entry point ───────────────────────────────────────────
-- SECURITY DEFINER runs as the function owner (the migration role, which
-- owns this table), so it bypasses RLS without needing a service-role key
-- anywhere in the app. This is the only way to insert into waitlist now.
CREATE OR REPLACE FUNCTION public.join_waitlist(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
BEGIN
  IF v_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22000';
  END IF;

  INSERT INTO public.waitlist (email) VALUES (v_email)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text) TO anon, authenticated;
