-- Tag each waitlist signup with where it came from.
--
-- The table was built for the Pro-launch waitlist on /pricing. The homepage's
-- Write mode now collects early-access signups through the same endpoint, so
-- without a source column the two lists are indistinguishable.

ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS source text;

-- Every row that exists today came from the Pro form, the only caller until now.
UPDATE public.waitlist SET source = 'pro' WHERE source IS NULL;

-- Replace rather than overload: two join_waitlist signatures would make an RPC
-- call carrying only p_email ambiguous. The default keeps that call valid, so
-- code deployed before this migration keeps working after it.
DROP FUNCTION IF EXISTS public.join_waitlist(text);

CREATE OR REPLACE FUNCTION public.join_waitlist(p_email text, p_source text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_source text := nullif(lower(trim(p_source)), '');
BEGIN
  IF v_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' THEN
    RAISE EXCEPTION 'invalid_email' USING ERRCODE = '22000';
  END IF;

  IF v_source IS NOT NULL AND v_source !~ '^[a-z]{1,32}$' THEN
    RAISE EXCEPTION 'invalid_source' USING ERRCODE = '22000';
  END IF;

  -- email stays unique, so an address already on the Pro list keeps its
  -- original source rather than being duplicated.
  INSERT INTO public.waitlist (email, source) VALUES (v_email, v_source)
  ON CONFLICT (email) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.join_waitlist(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_waitlist(text, text) TO anon, authenticated;
