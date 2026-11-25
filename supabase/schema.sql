-- FINSMART AI account data. Apply this in the Supabase SQL editor after enabling Supabase Auth.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(14, 2) not null check (amount > 0),
  category text not null,
  transaction_date date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  saved_amount numeric(14, 2) not null default 0 check (saved_amount >= 0),
  deadline date,
  created_at timestamptz not null default now(),
  check (saved_amount <= target_amount)
);

create table if not exists public.savings_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.savings_goals(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  deposit_date date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  color text not null default '#76865e',
  period_start date not null,
  created_at timestamptz not null default now()
);

-- Remove the original label/period uniqueness rule; budget rows are keyed by user-owned UUID.
alter table public.budget_allocations
  drop constraint if exists budget_allocations_user_id_label_period_start_key;

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists savings_goals_user_idx
  on public.savings_goals (user_id, created_at desc);
create index if not exists savings_deposits_user_goal_idx
  on public.savings_deposits (user_id, goal_id, deposit_date desc);
create index if not exists budget_allocations_user_period_idx
  on public.budget_allocations (user_id, period_start);

alter table public.transactions enable row level security;
alter table public.savings_goals enable row level security;
alter table public.savings_deposits enable row level security;
alter table public.budget_allocations enable row level security;

grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;
grant select, insert, update, delete on public.savings_deposits to authenticated;
grant select, insert, update, delete on public.budget_allocations to authenticated;

create policy "Users manage their own transactions"
  on public.transactions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own savings goals"
  on public.savings_goals for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their own savings deposits"
  on public.savings_deposits for all to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.savings_goals
      where savings_goals.id = goal_id
        and savings_goals.user_id = auth.uid()
    )
  );

create policy "Users manage their own budget allocations"
  on public.budget_allocations for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
