-- Sanctions could deduct credits but had no way to confiscate equipment as
-- part of a punishment. Confiscated inventory rows get deleted (no refund,
-- unlike a resale), so we snapshot what was taken here for history — the
-- same reasoning as inventory.item_name/item_image_url already snapshotting
-- catalog data instead of joining live.

alter table public.sanctions add column confiscated_items jsonb;

comment on column public.sanctions.confiscated_items is
  'Snapshot [{id, name}] of inventory items confiscated by this sanction — the inventory rows themselves are deleted, unlike a resale which keeps history via transactions.';
