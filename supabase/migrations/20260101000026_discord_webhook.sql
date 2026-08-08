-- Opt-in Discord webhook notifications. Uses a plain Discord channel webhook
-- URL (Server Settings → Integrations → Webhooks in Discord) — no bot/app
-- registration needed, unlike the previously-scoped-out "Discord bot"
-- integration which would require a bot token and a hosted process.

create table public.integration_settings (
  id boolean primary key default true,
  discord_webhook_url text,
  notify_on_event boolean not null default true,
  notify_on_notification boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null,
  constraint integration_settings_singleton check (id)
);

comment on table public.integration_settings is 'Fila única de configuración de integraciones externas (Discord webhook).';

insert into public.integration_settings (id) values (true);

alter table public.integration_settings enable row level security;

create policy "integration_settings_select_command_staff" on public.integration_settings
  for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true));

create policy "integration_settings_update_command_staff" on public.integration_settings
  for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true));
