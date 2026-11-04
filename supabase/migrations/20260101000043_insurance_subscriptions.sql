-- Operator insurance subscriptions: soldiers opt in and pay from their own credits.
-- Only expenses with category = 'Seguro' are eligible.

create table public.insurance_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  expense_id    uuid not null references public.recurring_expenses(id) on delete cascade,
  subscribed_at timestamptz not null default now(),
  unique (profile_id, expense_id)
);

alter table public.insurance_subscriptions enable row level security;

-- Soldiers can read and manage only their own subscriptions
create policy "insurance_subs_own" on public.insurance_subscriptions
  for all using (profile_id = auth.uid());

-- Command staff can read all
create policy "insurance_subs_cs_read" on public.insurance_subscriptions
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and is_command_staff = true
  ));

-- Allow soldiers to read insurance expense rows (category = 'Seguro') in tienda
-- (recurring_expenses is otherwise restricted to command staff)
create policy "recurring_expenses_insurance_read" on public.recurring_expenses
  for select using (category = 'Seguro');
