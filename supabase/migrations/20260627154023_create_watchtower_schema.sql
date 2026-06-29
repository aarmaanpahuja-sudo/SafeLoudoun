/*
# WatchTower Community Watch Schema

1. Overview
   Single-tenant (no auth) real-time community watch app. All data is intentionally
   public/shared across all users in a zip-code community. Reports posted by one user
   are saved and instantly synced to every other user viewing that community via
   Supabase Realtime.

2. New Tables
   - `incidents`: core report records (category, title, location, zip, status, verifications, lat/lng).
   - `comments`: micro-comments attached to an incident.
   - `watch_zones`: saved zip codes per browser (keyed by a local client id).
   - `profiles`: neighbor karma score per client id.

3. Security
   - RLS enabled on every table.
   - All policies use `TO anon, authenticated` because the app has no sign-in screen;
     data is intentionally public/shared within a community.
   - `USING (true)` / `WITH CHECK (true)` is correct here: the data is public by design.

4. Realtime
   - Publications enabled for incidents and comments so the frontend can subscribe
     to INSERT / UPDATE / DELETE events and sync across all clients instantly.

5. Notes
   - `client_id` is a uuid generated in the browser and persisted in localStorage; it
     identifies a "user" without requiring auth. It is NOT a security boundary.
   - `verifications` is an integer counter incremented by neighbors.
   - `karma` is an integer on profiles, +10 per report submitted.
*/

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  location_description text,
  zip_code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  verifications integer NOT NULL DEFAULT 0,
  latitude double precision,
  longitude double precision,
  reporter_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_incidents" ON incidents;
CREATE POLICY "anon_select_incidents" ON incidents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_incidents" ON incidents;
CREATE POLICY "anon_insert_incidents" ON incidents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_incidents" ON incidents;
CREATE POLICY "anon_update_incidents" ON incidents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_incidents" ON incidents;
CREATE POLICY "anon_delete_incidents" ON incidents FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS incidents_zip_code_idx ON incidents (zip_code);
CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents (status);
CREATE INDEX IF NOT EXISTS incidents_created_at_idx ON incidents (created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS comments_incident_id_idx ON comments (incident_id);

CREATE TABLE IF NOT EXISTS watch_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  zip_code text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, zip_code)
);

ALTER TABLE watch_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_watch_zones" ON watch_zones;
CREATE POLICY "anon_select_watch_zones" ON watch_zones FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_watch_zones" ON watch_zones;
CREATE POLICY "anon_insert_watch_zones" ON watch_zones FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_watch_zones" ON watch_zones;
CREATE POLICY "anon_delete_watch_zones" ON watch_zones FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS watch_zones_client_id_idx ON watch_zones (client_id);

CREATE TABLE IF NOT EXISTS profiles (
  client_id uuid PRIMARY KEY,
  display_name text,
  karma integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_profiles" ON profiles;
CREATE POLICY "anon_select_profiles" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_profiles" ON profiles;
CREATE POLICY "anon_insert_profiles" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_profiles" ON profiles;
CREATE POLICY "anon_update_profiles" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

-- Enable realtime publication for the tables the frontend subscribes to.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'incidents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
END $$;
