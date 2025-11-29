-- Quick Fix: Disable RLS on reports table for testing
-- Run this in Supabase SQL Editor

alter table public.reports disable row level security;

-- Also disable for alerts table (brain.py needs to insert)
alter table public.alerts disable row level security;

-- Verify
select tablename, rowsecurity 
from pg_tables 
where schemaname = 'public' 
and tablename in ('reports', 'alerts');
