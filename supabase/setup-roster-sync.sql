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
