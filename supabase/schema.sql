-- Jalankan sekali di Supabase: SQL Editor > New query > Run.
create table if not exists public.card_progress (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  word text not null,
  box int not null check (box between 1 and 6),
  due date not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, word)
);
create table if not exists public.user_state (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: wajib, karena anon key terlihat publik di browser.
alter table public.card_progress enable row level security;
alter table public.user_state enable row level security;

create policy "own cards" on public.card_progress for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own state" on public.user_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
