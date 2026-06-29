/*
# Make watch_zones.client_id nullable

Signed-in users add zones keyed by user_id, not client_id. The client_id
column was NOT NULL with no default, so inserting a zone for a signed-in
user (who omits client_id) failed with a NOT NULL violation. Making it
nullable lets both anon (client_id set) and signed-in (user_id set) users
add zones.
*/

ALTER TABLE watch_zones ALTER COLUMN client_id DROP NOT NULL;
