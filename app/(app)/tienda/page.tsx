import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import { getFullCatalog, getInsuranceCatalog } from "@/lib/data/catalog";
import { getOwnInventory } from "@/lib/data/dashboard";
import { formatCredits } from "@/lib/format";
import { CatalogTabs } from "@/components/shop/catalog-tabs";

export const metadata: Metadata = { title: "Tienda — G.O.C.S." };

export default async function TiendaPage() {
  const profile = await getCurrentProfile();

  const [catalog, inventory, insurance] = await Promise.all([
    getFullCatalog(),
    getOwnInventory(),
    getInsuranceCatalog(profile.id),
  ]);

  // License flags: fetch all license items and distinguish by name.
  // Equipment license must mention "equipamiento"; accessories license is any other license.
  const licenseItems = inventory.filter((i) => /licencia/i.test(i.item_name ?? ""));
  const hasAccessoryLicense = licenseItems.some((i) => !/equipamiento/i.test(i.item_name ?? ""));
  const hasEquipmentLicense = licenseItems.some((i) => /equipamiento/i.test(i.item_name ?? ""));

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative overflow-hidden rounded-xl border border-white/8 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "linear-gradient(135deg, oklch(0.16 0.006 240), oklch(0.13 0.004 240) 70%, oklch(0.55 0.18 55 / 12%) 100%)" }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1">G.O.C.S. · Arsenal</p>
          <h1 className="font-heading text-3xl">Tienda</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Armamento, equipamiento y vehículos del clan.</p>
        </div>
        <div className="relative flex flex-col sm:items-end gap-0.5">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Tu saldo</p>
          <p className="font-heading text-3xl text-gocs-red tabular-nums">{formatCredits(profile.cached_balance)}</p>
        </div>
      </div>

      <CatalogTabs
        initial={catalog}
        balance={profile.cached_balance}
        canBuy={profile.approved}
        myRankSortOrder={profile.rank?.sort_order ?? -1}
        hasAccessoryLicense={hasAccessoryLicense}
        hasEquipmentLicense={hasEquipmentLicense}
        insurance={insurance}
      />
    </div>
  );
}
