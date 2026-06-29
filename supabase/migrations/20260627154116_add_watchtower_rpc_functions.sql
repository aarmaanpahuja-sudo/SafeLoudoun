/*
# WatchTower helper RPC functions

1. Overview
   Two security-definer functions used by the anon-key frontend:
   - `increment_verification(p_id uuid)`: atomically increments an incident's
     verification counter and returns the new value.
   - `bump_karma(p_client uuid)`: increments a profile's karma by 10 (creates
     the profile row if it does not exist).

2. Security
   Both functions are SECURITY DEFINER so the anon role can invoke them despite
   RLS. They only touch the row identified by their argument, so there is no
   cross-row escalation risk.
*/

CREATE OR REPLACE FUNCTION increment_verification(p_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE incidents
  SET verifications = verifications + 1, updated_at = now()
  WHERE id = p_id
  RETURNING verifications INTO new_count;
  RETURN new_count;
END;
$$;

CREATE OR REPLACE FUNCTION bump_karma(p_client uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (client_id, karma)
  VALUES (p_client, 10)
  ON CONFLICT (client_id)
  DO UPDATE SET karma = profiles.karma + 10;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_verification(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION bump_karma(uuid) TO anon, authenticated;
