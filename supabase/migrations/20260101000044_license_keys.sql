-- Proper license gate system.
-- Each catalog item can require a specific license key to be purchased.
-- License items themselves are sold in the store (category = 'Licencias')
-- and their name encodes which key they grant.
-- Keys: 'ropa' | 'accesorios' | 'accesorios_ropa'

alter table public.weapons     add column if not exists requires_license_key text;
alter table public.equipment   add column if not exists requires_license_key text;
alter table public.accessories add column if not exists requires_license_key text;
alter table public.vehicles    add column if not exists requires_license_key text;
