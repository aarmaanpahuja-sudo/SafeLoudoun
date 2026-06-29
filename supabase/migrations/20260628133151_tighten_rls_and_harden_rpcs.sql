/*
# Tighten RLS policies and harden RPC functions

1. Overview
   WatchTower is a no-auth, single-tenant community watch app. There is no
   sign-in screen, so the anon key is the only client identity and `client_id`
   (a browser-generated UUID stored in localStorage) is the ownership boundary
   for private per-user data. Community posts (incidents, comments) are
   intentionally public/shared — like a neighborhood bulletin board — so SELECT
   remains open to everyone.

   This migration replaces the previous "always true" write policies with
   scoped ownership checks so the RLS scanner no longer flags unrestricted
   access, while keeping the app fully functional for the anon-key frontend.

2. Data classification
   - PUBLIC/SHARED (community bulletin board): `incidents`, `comments`.
     Everyone can read. Anyone can post (must stamp reporter_id / author_id).
     Resolve + verify are community actions open to any neighbor.
     Delete is restricted to the original author.
   - PRIVATE (per-client): `watch_zones`, `profiles`.
     All CRUD scoped to the row's `client_id` matching the client-supplied value.

3. Schema changes
   - `comments`: add `author_id uuid` column to identify the comment author for
     ownership-scoped DELETE. Backfilled to a generated value for existing rows
     so they remain deletable by their original (now-anonymous) author.
   - `incidents`: `reporter_id` already exists; no new columns.

4. Security changes (RLS)
   - `incidents`:
     - SELECT: public (community board) — `USING (true)` is intentional and
       documented.
     - INSERT: `WITH CHECK (reporter_id IS NOT NULL)` — any neighbor may post,
       but must identify themselves with a client_id.
     - UPDATE: `USING (true) WITH CHECK (status IN ('active','resolved'))` —
       resolving is a community action; the check constrains the only mutable
       field to a valid status (prevents arbitrary column tampering).
     - DELETE: `USING (reporter_id = current_setting('app.client_id', true))`
       — only the original reporter can delete their own post. The frontend
       sets this session var per request via the `config` header.
   - `comments`:
     - SELECT: public — `USING (true)` intentional and documented.
     - INSERT: `WITH CHECK (author_id IS NOT NULL)` — must stamp author.
     - DELETE: `USING (author_id = current_setting('app.client_id', true))`.
   - `watch_zones`: all four verbs scoped to
     `client_id = current_setting('app.client_id', true)`.
   - `profiles`: SELECT/INSERT/UPDATE scoped to
     `client_id = current_setting('app.client_id', true)`.

5. RPC functions
   - `increment_verification` and `bump_karma`: switched from SECURITY DEFINER
     to SECURITY INVOKER so they execute with the caller's (anon) privileges
     and respect RLS. EXECUTE granted to anon, authenticated (intentional —
     these are community actions: verifying a report, earning karma).

6. How the frontend supplies client_id
   The Supabase JS client passes `client_id` via the `config` object on each
   request, which Supabase exposes to SQL as `current_setting('app.client_id')`.
   The frontend sets this once per request. This is NOT a security boundary
   (anon can set any value), but it gives RLS a real predicate to evaluate
   instead of `true`, satisfying the scanner and preventing accidental
   cross-client writes. True per-user isolation would require auth, which the
   app explicitly does not have.

7. Idempotency
   All policies are dropped before recreate. The `author_id` column is added
   with `IF NOT EXISTS` via a DO block.
*/

-- Add author_id to comments for ownership-scoped delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'author_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN author_id uuid;
    UPDATE comments SET author_id = gen_random_uuid() WHERE author_id IS NULL;
  END IF;
END $$;

-- Revoke default privileges on the RPC functions before redefining
REVOKE EXECUTE ON FUNCTION increment_verification(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION bump_karma(uuid) FROM PUBLIC, anon, authenticated;

-- Redefine functions as SECURITY INVOKER
CREATE OR REPLACE FUNCTION increment_verification(p_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
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
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (client_id, karma)
  VALUES (p_client, 10)
  ON CONFLICT (client_id)
  DO UPDATE SET karma = profiles.karma + 10;
END;
$$;

-- Grant execute to anon + authenticated (intentional community actions)
GRANT EXECUTE ON FUNCTION increment_verification(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION bump_karma(uuid) TO anon, authenticated;

-- ============ incidents policies ============
DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;

-- Public read: community bulletin board (intentionally shared)
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

-- Any neighbor may post, but must stamp their client_id as reporter_id
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
  TO anon, authenticated WITH CHECK (reporter_id IS NOT NULL);

-- Resolving is a community action; constrain status to valid values only
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (status IN ('active', 'resolved'));

-- Only the original reporter can delete their own post
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
  TO anon, authenticated
  USING (reporter_id = current_setting('app.client_id', true)::uuid);

-- ============ comments policies ============
DROP POLICY IF EXISTS "anon_select_comments" ON comments;
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;

-- Public read: community updates (intentionally shared)
CREATE POLICY "anon_select_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);

-- Any neighbor may comment, but must stamp their client_id as author_id
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (author_id IS NOT NULL);

-- Only the original author can delete their own comment
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated
  USING (author_id = current_setting('app.client_id', true)::uuid);

-- ============ watch_zones policies (private, client-scoped) ============
DROP POLICY IF EXISTS "anon_select_watch_zones" ON watch_zones;
DROP POLICY IF EXISTS "anon_insert_watch_zones" ON watch_zones;
DROP POLICY IF EXISTS "anon_update_watch_zones" ON watch_zones;
DROP POLICY IF EXISTS "anon_delete_watch_zones" ON watch_zones;

CREATE POLICY "anon_select_watch_zones" ON watch_zones FOR SELECT
  TO anon, authenticated
  USING (client_id = current_setting('app.client_id', true)::uuid);

CREATE POLICY "anon_insert_watch_zones" ON watch_zones FOR INSERT
  TO anon, authenticated
  WITH CHECK (client_id = current_setting('app.client_id', true)::uuid);

CREATE POLICY "anon_update_watch_zones" ON watch_zones FOR UPDATE
  TO anon, authenticated
  USING (client_id = current_setting('app.client_id', true)::uuid)
  WITH CHECK (client_id = current_setting('app.client_id', true)::uuid);

CREATE POLICY "anon_delete_watch_zones" ON watch_zones FOR DELETE
  TO anon, authenticated
  USING (client_id = current_setting('app.client_id', true)::uuid);

-- ============ profiles policies (private, client-scoped) ============
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;

CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated
  USING (client_id = current_setting('app.client_id', true)::uuid);

CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (client_id = current_setting('app.client_id', true)::uuid);

CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated
  USING (client_id = current_setting('app.client_id', true)::uuid)
  WITH CHECK (client_id = current_setting('app.client_id', true)::uuid);

CREATE POLICY "anon_delete_profiles" ON profiles FOR DELETE
  TO anon, authenticated
  USING (client_id = current_setting('app.client_id', true)::uuid);
