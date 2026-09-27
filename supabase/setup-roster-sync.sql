create table if not exists public.shift_sync_user_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  moods jsonb not null default '{}'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shift_sync_user_data enable row level security;

drop policy if exists "Users manage their own shift sync data"
on public.shift_sync_user_data;

create policy "Users manage their own shift sync data"
on public.shift_sync_user_data
for all to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

grant select, insert, update, delete
on public.shift_sync_user_data to authenticated;

alter table public.period_logs replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shift_sync_user_data'
  ) then
    alter publication supabase_realtime add table public.shift_sync_user_data;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'period_logs'
  ) then
    alter publication supabase_realtime add table public.period_logs;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cycle_settings'
  ) then
    alter publication supabase_realtime add table public.cycle_settings;
  end if;
end;
$$;

create unique index if not exists period_logs_one_start_per_month_idx
on public.period_logs (user_id, (date_trunc('month', start_date::timestamp)));
