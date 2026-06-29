/*
# Fix bump_karma conflict targets

profiles now uses a unique partial index on client_id (WHERE client_id IS NOT
NULL) instead of client_id as the primary key. ON CONFLICT needs to reference
the index columns explicitly. Also drop the old single-arg overload so only
the two-arg version exists.
*/

-- Drop any existing versions
DROP FUNCTION IF EXISTS bump_karma(uuid);
DROP FUNCTION IF EXISTS bump_karma(uuid, uuid);

CREATE OR REPLACE FUNCTION bump_karma(p_client uuid, p_user uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF p_user IS NOT NULL THEN
    INSERT INTO profiles (user_id, karma)
    VALUES (p_user, 10)
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL
    DO UPDATE SET karma = profiles.karma + 10;
  ELSIF p_client IS NOT NULL THEN
    INSERT INTO profiles (client_id, karma)
    VALUES (p_client, 10)
    ON CONFLICT (client_id) WHERE client_id IS NOT NULL
    DO UPDATE SET karma = profiles.karma + 10;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION bump_karma(uuid, uuid) TO anon, authenticated;
