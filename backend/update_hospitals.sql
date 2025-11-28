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

-- Drop policy if exists to avoid error on re-run
drop policy if exists "Public hospitals read access" on hospitals;

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
