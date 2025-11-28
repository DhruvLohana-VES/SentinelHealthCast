-- Simple Citizen Users Table for Hackathon
create table if not exists citizen_users (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    phone text unique not null,
    password text not null, -- Plaintext for hackathon speed
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table citizen_users enable row level security;

create policy "Public citizen read access"
  on citizen_users for select
  using ( true );

create policy "Public citizen insert access"
  on citizen_users for insert
  with check ( true );
