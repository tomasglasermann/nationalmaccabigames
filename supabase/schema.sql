-- NMB admin — database schema
-- Run this in the Supabase dashboard:  SQL Editor -> New query -> paste -> Run
-- (Safe to run more than once.)

create extension if not exists "pgcrypto";

-- Interest-form submissions from the public website
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  participant_first_name text,
  participant_last_name  text,
  participant_phone      text,
  participant_dob        text,
  parent1_first_name     text,
  parent1_last_name      text,
  parent1_email          text,
  parent1_phone          text,
  sport                  text,
  status                 text not null default 'new',   -- new | contacted | confirmed | declined
  notes                  text
);
create index if not exists registrations_created_idx on public.registrations (created_at desc);

-- Donations received from RedPodium (via webhook)
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  donor_name  text,
  donor_email text,
  amount      numeric,
  currency    text default 'USD',
  source      text default 'redpodium',
  raw         jsonb
);
create index if not exists donations_created_idx on public.donations (created_at desc);

-- Uniform tracking per athlete
create table if not exists public.uniforms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  registration_id uuid references public.registrations(id) on delete set null,
  athlete_name text not null,
  sport text,
  item  text,
  size  text,
  status text not null default 'needed',   -- needed | ordered | received
  notes text
);
create index if not exists uniforms_created_idx on public.uniforms (created_at desc);

-- Log of emails sent from the Communications tab (used in a later phase)
create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  subject text,
  body text,
  recipients jsonb,
  sent_count integer default 0,
  status text default 'sent',
  resend_id text
);

-- The app connects with the Supabase SERVICE ROLE key from server-side code
-- only, which bypasses Row Level Security. We still enable RLS and add no
-- public policies, so these tables are NOT readable with the public anon key.
alter table public.registrations enable row level security;
alter table public.donations     enable row level security;
alter table public.uniforms       enable row level security;
alter table public.communications enable row level security;
