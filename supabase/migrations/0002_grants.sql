-- Table access for the site. Run once in the Supabase SQL Editor, after 0001.
--
-- Newer Supabase projects don't automatically let the site's keys reach new
-- tables, which shows up as "permission denied for table orders". This grants
-- exactly what the site needs. Row Level Security from 0001 still applies:
-- signed-in customers can only read their own rows, and they can't write.

grant usage on schema public to anon, authenticated, service_role;

-- The server (service role key) does all the writing.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Signed-in customers read their own orders, proofs, files and messages.
grant select on all tables in schema public to authenticated;

-- Same rules for any tables added later.
alter default privileges in schema public grant all privileges on tables to service_role;
alter default privileges in schema public grant all privileges on sequences to service_role;
alter default privileges in schema public grant select on tables to authenticated;
