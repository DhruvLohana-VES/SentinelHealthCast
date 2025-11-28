-- Allow public inserts for citizen_reports (since we handle auth manually in the backend)
drop policy if exists "Citizens can create reports." on citizen_reports;

create policy "Allow public insert for citizen_reports"
  on citizen_reports for insert
  with check ( true );

-- Also ensure select is allowed for the backend to fetch pending reports
drop policy if exists "Officials can view all reports." on citizen_reports;

create policy "Allow public select for citizen_reports"
  on citizen_reports for select
  using ( true );

-- Allow update/delete for verification
create policy "Allow public update for citizen_reports"
  on citizen_reports for update
  using ( true );

create policy "Allow public delete for citizen_reports"
  on citizen_reports for delete
  using ( true );
