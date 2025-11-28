
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Enable Row Level Security
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- 1. PROFILES (Users & Roles)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text check (role in ('citizen', 'official')) default 'citizen',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. CITIZEN REPORTS (Perception Input)
create table public.citizen_reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id),
  location text not null, -- e.g., "Andheri East"
  description text,
  image_url text,
  verified boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.citizen_reports enable row level security;

create policy "Citizens can create reports."
  on citizen_reports for insert
  with check ( auth.uid() = user_id );

create policy "Everyone can view verified reports."
  on citizen_reports for select
  using ( verified = true );

create policy "Officials can view all reports."
  on citizen_reports for select
  using ( 
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'official'
    )
  );

-- 3. DISPATCH TICKETS (The "Pause" State)
create table public.dispatch_tickets (
  id uuid default uuid_generate_v4() primary key,
  risk_score numeric not null,
  location text not null,
  reasoning text not null, -- Why the AI wants to dispatch
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approved_at timestamp with time zone,
  approved_by uuid references public.profiles(id)
);

alter table public.dispatch_tickets enable row level security;

create policy "Officials can view and update tickets."
  on dispatch_tickets for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'official'
    )
  );

-- 4. SUBSCRIPTIONS (Who gets alerted)
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    location text not null,
    radius_km float default 5.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hospitals Table (Simple Auth for Hackathon)
create table if not exists hospitals (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    location text not null, -- e.g., "Andheri", "Bandra"
    username text unique not null,
    password text not null, -- Plaintext for hackathon speed, hash in prod!
    lat float,
    lng float,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies for Hospitals
alter table hospitals enable row level security;

create policy "Public hospitals read access"
  on hospitals for select
  using ( true );

-- Seed some hospital data
insert into hospitals (name, location, username, password, lat, lng)
values 
('Lilavati Hospital', 'Bandra West', 'lilavati', 'admin123', 19.0500, 72.8200),
('Kokilaben Hospital', 'Andheri West', 'kokilaben', 'admin123', 19.1300, 72.8200),
('Hiranandani Hospital', 'Powai', 'hiranandani', 'admin123', 19.1100, 72.9100)
on conflict (username) do nothing;

alter table public.subscriptions enable row level security;

create policy "Service role can manage subscriptions."
  on subscriptions for all
  using ( true ); -- Simplified for hackathon, ideally restricted
