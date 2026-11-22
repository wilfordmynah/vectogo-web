-- Lets customers attach files to messages on their order (extra logo
-- versions, fonts, references). Run once in the Supabase SQL Editor, after 0002.
-- Files live in the private "uploads" bucket under orders/<order id>/extra/.

alter table messages add column if not exists attachments text[] not null default '{}';
