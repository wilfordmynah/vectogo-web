-- Vectogo ordering and portal schema.
-- Run in the Supabase SQL editor (or `supabase db push`) once per project.
--
-- Security model: customers read their own rows through Row Level Security.
-- Every write goes through the site's server code using the service role key,
-- after it has checked who is asking. Files live in private storage buckets and
-- are only ever handed out as short-lived signed links.

create type order_status as enum (
  'awaiting_payment', -- order created, checkout not finished
  'paid',             -- in the queue; Vectogo replies within 24 hours
  'in_progress',      -- vectorizing and font matching under way
  'proof_ready',      -- customer needs to approve or request changes
  'revision_requested',
  'approved',         -- final files being exported
  'delivered',        -- all package formats downloadable
  'refunded'          -- full refund; files locked
);

create type payment_kind as enum ('package', 'upgrade', 'one_more_thing');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  business_name text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity (start with 1001) unique,
  customer_id uuid not null references profiles (id) on delete restrict,
  package text not null check (package in ('basic', 'oh_yeah', 'all')),
  status order_status not null default 'awaiting_payment',
  brief jsonb not null default '{}'::jsonb,
  logo_paths text[] not null default '{}',
  rounds_used int not null default 0,       -- revision requests made so far
  extra_rounds int not null default 0,      -- bought with One More Thing!
  refund_requested_at timestamptz,
  refunded_at timestamptz,
  paid_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on orders (customer_id, created_at desc);
create index orders_status_idx on orders (status, created_at);

create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  kind payment_kind not null,
  description text not null,
  amount_cents int not null,
  currency text not null default 'usd',
  upgrade_to text check (upgrade_to in ('oh_yeah', 'all')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  receipt_url text,
  invoice_url text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded', 'failed')),
  refunded_cents int not null default 0,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index payments_order_idx on payments (order_id);

create table proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  round int not null,                  -- 1 = first proof
  file_path text not null,
  note text,
  response text not null default 'pending' check (response in ('pending', 'approved', 'changes')),
  response_note text,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
create index proofs_order_idx on proofs (order_id, round);

create table deliverables (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  file_path text not null,
  label text not null,
  created_at timestamptz not null default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  from_vectogo boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);
create index messages_order_idx on messages (order_id, created_at);

-- Keep updated_at fresh.
create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger orders_touch before update on orders for each row execute function touch_updated_at();

-- Create a profile row for every new sign-in.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Row Level Security: customers can read their own things, nothing else.
alter table profiles enable row level security;
alter table orders enable row level security;
alter table payments enable row level security;
alter table proofs enable row level security;
alter table deliverables enable row level security;
alter table messages enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own orders" on orders for select using (customer_id = auth.uid());
create policy "own payments" on payments for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "own proofs" on proofs for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "own deliverables" on deliverables for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "own messages" on messages for select
  using (exists (select 1 from orders o where o.id = order_id and o.customer_id = auth.uid()));

-- Private file buckets. No storage policies: only the server touches them.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('uploads', 'uploads', false, 26214400),   -- customer logos, 25 MB each
  ('proofs', 'proofs', false, 52428800),
  ('finals', 'finals', false, 209715200)
on conflict (id) do nothing;
