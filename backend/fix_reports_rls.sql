-- Fix RLS policy for reports table to allow insertions
-- Run this in Supabase SQL Editor

drop policy if exists "Service can insert reports" on reports;
drop policy if exists "Service and anon can insert reports" on reports;

create policy "Anyone can insert reports"
    on reports for insert
    with check (true);

-- Verify policy
select * from pg_policies where tablename = 'reports';
