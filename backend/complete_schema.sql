-- ============================================================================
-- SENTINEL HEALTH CAST - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Run this entire file in Supabase SQL Editor to set up all tables
-- ============================================================================

-- Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis"; -- For location geometry

-- Grant Default Permissions
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- ============================================================================
-- 1. WARDS TABLE (Mumbai Administrative Zones)
-- ============================================================================
create table if not exists public.wards (
    id uuid default uuid_generate_v4() primary key,
    name text not null unique, -- "Andheri East", "Bandra West", etc.
    ward_number text, -- "A", "B", "C", etc.
    boundary geometry(MultiPolygon, 4326), -- Geographic boundary
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wards enable row level security;

create policy "Public wards read access"
    on wards for select
    using ( true );

-- Seed Mumbai Wards Data (24 major wards)
insert into wards (name, ward_number) values
('Andheri East', 'A'),
('Andheri West', 'B'),
('Bandra East', 'C'),
('Bandra West', 'D'),
('Borivali East', 'E'),
('Borivali West', 'F'),
('Chembur', 'G'),
('Dadar', 'H'),
('Dharavi', 'I'),
('Goregaon East', 'J'),
('Goregaon West', 'K'),
('Juhu', 'L'),
('Kurla', 'M'),
('Malad East', 'N'),
('Malad West', 'O'),
('Powai', 'P'),
('Santacruz East', 'Q'),
('Santacruz West', 'R'),
('Versova', 'S'),
('Vile Parle', 'T'),
('Worli', 'U'),
('Vikhroli', 'V'),
('Mulund', 'W'),
('Ghatkopar', 'X')
on conflict (name) do nothing;

-- Ward Matching Function (for lat/lon to ward_id)
create or replace function match_ward(lat float, long float)
returns table(id uuid, name text) as $$
begin
    -- Simple nearest-neighbor matching
    -- In production, use ST_Contains with actual ward boundaries
    return query
    select w.id, w.name
    from wards w
    order by random() -- Placeholder: Replace with actual spatial query
    limit 1;
end;
$$ language plpgsql;

-- ============================================================================
-- 2. PROFILES (Auth Users & Roles)
-- ============================================================================
create table if not exists public.profiles (
    id uuid references auth.users not null primary key,
    email text,
    role text check (role in ('citizen', 'official')) default 'citizen',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
    on profiles for select
    using ( true );

create policy "Users can insert their own profile"
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile"
    on profiles for update
    using ( auth.uid() = id );

-- ============================================================================
-- 3. CITIZEN USERS (Hackathon Simple Auth)
-- ============================================================================
create table if not exists public.citizen_users (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    phone text unique not null,
    password text not null, -- Plaintext for hackathon
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.citizen_users enable row level security;

create policy "Public citizen read access"
    on citizen_users for select
    using ( true );

create policy "Public citizen insert access"
    on citizen_users for insert
    with check ( true );

-- Seed Demo Citizen User
insert into citizen_users (name, phone, password) values
('Demo User', '9876543210', 'demo123')
on conflict (phone) do nothing;

-- ============================================================================
-- 4. HOSPITALS (Medical Facilities)
-- ============================================================================
create table if not exists public.hospitals (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    location text not null,
    username text unique not null,
    password text not null, -- Plaintext for hackathon
    lat float,
    lng float,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.hospitals enable row level security;

drop policy if exists "Public hospitals read access" on hospitals;
create policy "Public hospitals read access"
    on hospitals for select
    using ( true );

-- Seed Hospital Data
insert into hospitals (name, location, username, password, lat, lng) values
('Lilavati Hospital', 'Bandra West', 'lilavati', 'admin123', 19.0500, 72.8200),
('Kokilaben Hospital', 'Andheri West', 'kokilaben', 'admin123', 19.1300, 72.8200),
('Hiranandani Hospital', 'Powai', 'hiranandani', 'admin123', 19.1100, 72.9100)
on conflict (username) do nothing;

-- ============================================================================
-- 5. CITIZEN REPORTS (Web UI Submissions)
-- ============================================================================
create table if not exists public.citizen_reports (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id),
    ward_id uuid references public.wards(id),
    location text not null,
    description text,
    image_url text,
    verified boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.citizen_reports enable row level security;

create policy "Citizens can create reports"
    on citizen_reports for insert
    with check ( auth.uid() = user_id );

create policy "Everyone can view verified reports"
    on citizen_reports for select
    using ( verified = true );

create policy "Officials can view all reports"
    on citizen_reports for select
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'official'
        )
    );

-- ============================================================================
-- 6. REPORTS (Telegram Bot Submissions)
-- ============================================================================
create table if not exists public.reports (
    id uuid default uuid_generate_v4() primary key,
    ward_id uuid references public.wards(id),
    image_url text,
    description text,
    severity integer check (severity between 1 and 10),
    type text, -- 'Garbage', 'Stagnant Water', etc.
    location geometry(Point, 4326), -- PostGIS point
    chat_id bigint, -- Telegram chat_id for notifications
    verified boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.reports enable row level security;

create policy "Public can view verified reports"
    on reports for select
    using (verified = true);

create policy "Service and anon can insert reports"
    on reports for insert
    with check (true);

create policy "Officials can view all reports"
    on reports for select
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'official'
        )
    );

-- ============================================================================
-- 7. ALERTS (AI-Generated Outbreak Warnings)
-- ============================================================================
create table if not exists public.alerts (
    id uuid default uuid_generate_v4() primary key,
    ward_id uuid references public.wards(id),
    severity text check (severity in ('HIGH', 'CRITICAL', 'MODERATE', 'LOW')),
    message text not null,
    action_plan jsonb, -- Full AI response
    acknowledged boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.alerts enable row level security;

create policy "Public can view alerts"
    on alerts for select
    using (true);

create policy "Officials can update alerts"
    on alerts for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'official'
        )
    );

create policy "Service can insert alerts"
    on alerts for insert
    with check (true);

-- ============================================================================
-- 8. DISPATCH TICKETS (AI Action Approval Queue)
-- ============================================================================
create table if not exists public.dispatch_tickets (
    id uuid default uuid_generate_v4() primary key,
    risk_score numeric not null,
    location text not null,
    reasoning text not null,
    status text check (status in ('pending', 'approved', 'rejected')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    approved_at timestamp with time zone,
    approved_by uuid references public.profiles(id)
);

alter table public.dispatch_tickets enable row level security;

create policy "Officials can view and update tickets"
    on dispatch_tickets for all
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'official'
        )
    );

-- ============================================================================
-- 9. SUBSCRIPTIONS (Alert Notifications)
-- ============================================================================
create table if not exists public.subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    location text not null,
    radius_km float default 5.0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.subscriptions enable row level security;

create policy "Service role can manage subscriptions"
    on subscriptions for all
    using ( true );

-- ============================================================================
-- INDEXES (Performance Optimization)
-- ============================================================================
create index if not exists reports_ward_id_idx on public.reports(ward_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);
create index if not exists alerts_ward_id_idx on public.alerts(ward_id);
create index if not exists alerts_created_at_idx on public.alerts(created_at desc);
create index if not exists citizen_reports_ward_id_idx on public.citizen_reports(ward_id);
create index if not exists citizen_reports_created_at_idx on public.citizen_reports(created_at desc);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on public.wards to anon, authenticated, service_role;
grant all on public.profiles to anon, authenticated, service_role;
grant all on public.citizen_users to anon, authenticated, service_role;
grant all on public.hospitals to anon, authenticated, service_role;
grant all on public.citizen_reports to anon, authenticated, service_role;
grant all on public.reports to anon, authenticated, service_role;
grant all on public.alerts to anon, authenticated, service_role;
grant all on public.dispatch_tickets to anon, authenticated, service_role;
grant all on public.subscriptions to anon, authenticated, service_role;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables created with proper RLS policies and permissions
-- Demo data seeded for wards, hospitals, and citizen users
-- ============================================================================
