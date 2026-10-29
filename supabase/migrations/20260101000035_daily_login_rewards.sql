-- Daily login streak tracking
alter table public.profiles
  add column if not exists login_streak int not null default 0,
  add column if not exists last_login_date date;
