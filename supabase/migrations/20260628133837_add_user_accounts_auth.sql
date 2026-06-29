/*
# Add user accounts (email/password auth)

1. Overview
   WatchTower now supports optional email/password sign-in. When a user signs
   in, their profile (display name, karma, watch zones) is tied to their auth
   account via user_id. The app remains usable without sign-in (anon mode)
   using the existing client_id browser UUID, but signing in lets a user
   access their data across devices/browsers.

2. Schema changes
   - `profiles`: add `user_id uuid` column (nullable, references auth.users).
     When a user signs in, we upsert their profile keyed by user_id. The
     existing client_id column remains for anon-mode backward compatibility.
     A unique constraint on user_id ensures one profile per account.
   - `watch_zones`: add `user_id uuid` column (nullable, references auth.users).
     Signed-in users' zones are scoped by user_id; anon users' zones by
     client_id.
   - `incidents`: add `user_id uuid` column (nullable, references auth.users)
     so signed-in reporters are tracked. reporter_id (client_id) remains for
     backward compat and anon mode.
   - `comments`: add `user_id uuid` column (nullable) for signed-in authors.

3. Security changes (RLS)
   - `profiles`: SELECT/INSERT/UPDATE now allow EITHER auth.uid() = user_id
     (signed-in) OR client_id = current_setting('app.client_id') (anon).
     This dual-path keeps both modes working.
   - `watch_zones`: same dual-path — auth.uid() = user_id OR client_id match.
   - `incidents`: INSERT now allows reporter_id IS NOT NULL (anon) OR
     user_id = auth.uid() (signed in). DELETE allows reporter_id match (anon)
     OR user_id = auth.uid() (signed in).
   - `comments`: INSERT allows author_id IS NOT NULL (anon) OR user_id =
     auth.uid(). DELETE allows author_id match (anon) OR user_id = auth.uid().

4. RPC functions
   - `bump_karma`: now accepts an optional p_user uuid. If provided, bumps
     karma on the user_id-keyed profile; otherwise falls back to client_id.
   - `increment_verification`: unchanged (SECURITY INVOKER, community action).

5. Idempotency
   All column additions use IF NOT EXISTS via DO blocks. Policies are dropped
   before recreate.
*/

-- Add user_id to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX profiles_user_id_key ON profiles(user_id) WHERE user_id IS NOT NULL;
  END IF;
END $$;

-- Add user_id to watch_zones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'watch_zones' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE watch_zones ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to incidents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'incidents' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE incidents ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add user_id to comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE comments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Redefine bump_karma to support both user_id and client_id
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
  ELSE
    INSERT INTO profiles (client_id, karma)
    VALUES (p_client, 10)
    ON CONFLICT (client_id)
    DO UPDATE SET karma = profiles.karma + 10;
  END IF;
END;
$$;

-- ============ profiles policies (dual-path: auth or client_id) ============
DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
DROP POLICY IF EXISTS "anon_delete_profiles" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO anon, authenticated
  USING (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO anon, authenticated
  USING (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  TO anon, authenticated
  USING (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

-- ============ watch_zones policies (dual-path) ============
DROP POLICY IF EXISTS "anon_select_watch_zones" ON watch_zones;
DROP POLICY IF EXISTS "anon_insert_watch_zones" ON watch_zones;
DROP POLICY IF EXISTS "anon_update_watch_zones" ON watch_zones;
DROP POLICY IF EXISTS "anon_delete_watch_zones" ON watch_zones;

CREATE POLICY "zones_select" ON watch_zones FOR SELECT
  TO anon, authenticated
  USING (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

CREATE POLICY "zones_insert" ON watch_zones FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

CREATE POLICY "zones_update" ON watch_zones FOR UPDATE
  TO anon, authenticated
  USING (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  )
  WITH CHECK (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

CREATE POLICY "zones_delete" ON watch_zones FOR DELETE
  TO anon, authenticated
  USING (
    client_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

-- ============ incidents policies (dual-path) ============
DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;

CREATE POLICY "incidents_select" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "incidents_insert" ON incidents FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    reporter_id IS NOT NULL
    OR user_id = auth.uid()
  );

CREATE POLICY "incidents_update" ON incidents FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (status IN ('active', 'resolved'));

CREATE POLICY "incidents_delete" ON incidents FOR DELETE
  TO anon, authenticated
  USING (
    reporter_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );

-- ============ comments policies (dual-path) ============
DROP POLICY IF EXISTS "anon_select_comments" ON comments;
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;

CREATE POLICY "comments_select" ON comments FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "comments_insert" ON comments FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    author_id IS NOT NULL
    OR user_id = auth.uid()
  );

CREATE POLICY "comments_delete" ON comments FOR DELETE
  TO anon, authenticated
  USING (
    author_id = current_setting('app.client_id', true)::uuid
    OR user_id = auth.uid()
  );
