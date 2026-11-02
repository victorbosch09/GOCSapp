-- Custom store sections: lets Command Staff add new catalog tabs beyond the
-- four fixed ones (weapons / equipment / accessories / vehicles).

create table public.store_sections (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.store_sections is
  'Custom top-level catalog sections created by Command Staff (e.g. Explosivos, Indumentaria).';

create table public.store_section_items (
  id                  uuid primary key default gen_random_uuid(),
  section_id          uuid not null references public.store_sections(id) on delete cascade,
  category            text not null default '',
  name                text not null,
  price               int  not null default 0 check (price >= 0),
  stock               int  not null default 0 check (stock >= 0),
  image_url           text,
  notes               text,
  min_rank_sort_order int,
  created_at          timestamptz not null default now()
);

comment on table public.store_section_items is
  'Items belonging to a custom store section.';

-- RLS
alter table public.store_sections      enable row level security;
alter table public.store_section_items enable row level security;

-- Approved users can read
create policy "store_sections_select_approved" on public.store_sections
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and approved = true)
  );

create policy "store_section_items_select_approved" on public.store_section_items
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and approved = true)
  );

-- Only Command Staff can write
create policy "store_sections_write_command_staff" on public.store_sections
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true)
  );

create policy "store_section_items_write_command_staff" on public.store_section_items
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_command_staff = true)
  );
