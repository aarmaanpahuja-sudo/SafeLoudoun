/*
# Restructure profiles primary key

profiles.client_id was the PRIMARY KEY and NOT NULL, but signed-in users
key their profile by user_id instead. This migration:

1. Drops the existing client_id primary key constraint.
2. Adds a new `id uuid` column as the primary key (gen_random_uuid default).
3. Makes client_id nullable (signed-in users don't have one).
4. Adds unique partial indexes on client_id and user_id so both can serve
   as lookup keys without colliding.

No data is lost — existing rows get a generated id and keep their client_id.
*/

-- Drop the old client_id primary key constraint first
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;

-- Add new id column as primary key
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid();

-- Make client_id nullable
ALTER TABLE profiles ALTER COLUMN client_id DROP NOT NULL;

-- Unique partial indexes so each key is unique when present
CREATE UNIQUE INDEX IF NOT EXISTS profiles_client_id_key
  ON profiles(client_id) WHERE client_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key
  ON profiles(user_id) WHERE user_id IS NOT NULL;
