-- Create the 'reports' table for Telegram Bot submissions
-- This is separate from citizen_reports (web UI submissions)
create table if not exists public.reports (
    id uuid default uuid_generate_v4() primary key,
    ward_id uuid references public.wards(id),
    image_url text,
    description text,
    severity integer check (severity between 1 and 10),
    type text, -- 'Garbage', 'Stagnant Water', etc.
    location geometry(Point, 4326), -- PostGIS point for lat/lon
    chat_id bigint, -- Telegram chat_id for notifications
    verified boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.reports enable row level security;

-- Public can view verified reports
create policy "Public can view verified reports"
    on reports for select
    using (verified = true);

-- Service role can insert (for telegram bot)
create policy "Service can insert reports"
    on reports for insert
    with check (true);

-- Officials can view all
create policy "Officials can view all reports"
    on reports for select
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'official'
        )
    );

-- Create the 'alerts' table for AI-generated outbreak warnings
create table if not exists public.alerts (
    id uuid default uuid_generate_v4() primary key,
    ward_id uuid references public.wards(id),
    severity text check (severity in ('HIGH', 'CRITICAL', 'MODERATE', 'LOW')),
    message text not null, -- Short alert title
    action_plan jsonb, -- Full AI-generated plan with all details
    acknowledged boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.alerts enable row level security;

-- Everyone can view alerts
create policy "Public can view alerts"
    on alerts for select
    using (true);

-- Officials can acknowledge alerts
create policy "Officials can update alerts"
    on alerts for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid() and profiles.role = 'official'
        )
    );

-- Service role can insert (for brain.py)
create policy "Service can insert alerts"
    on alerts for insert
    with check (true);

-- Create indexes for performance
create index if not exists reports_ward_id_idx on public.reports(ward_id);
create index if not exists reports_created_at_idx on public.reports(created_at desc);
create index if not exists alerts_ward_id_idx on public.alerts(ward_id);
create index if not exists alerts_created_at_idx on public.alerts(created_at desc);

-- Grant permissions
grant usage on schema public to anon, authenticated;
grant all on public.reports to anon, authenticated, service_role;
grant all on public.alerts to anon, authenticated, service_role;
