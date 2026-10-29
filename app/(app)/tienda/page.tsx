import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import { getFullCatalog } from "@/lib/data/catalog";
import { formatCredits } from "@/lib/format";
import { CatalogTabs } from "@/components/shop/catalog-tabs";

export const metadata: Metadata = { title: "Tienda — G.O.C.S." };

export default async function TiendaPage() {
  const [profile, catalog] = await Promise.all([getCurrentProfile(), getFullCatalog()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card-tactical p-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl">Tienda</h1>
          <p className="text-muted-foreground text-sm">Armamento, equipamiento, accesorios y vehículos del clan.</p>
        </div>
        <div className="flex flex-col sm:items-end gap-0.5 mt-2 sm:mt-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Tu saldo</p>
          <p className="font-heading text-3xl text-gocs-red">{formatCredits(profile.cached_balance)}</p>
        </div>
      </div>

      <CatalogTabs
        initial={catalog}
        balance={profile.cached_balance}
        canBuy={profile.approved}
        myRankSortOrder={profile.rank?.sort_order ?? -1}
      />
    </div>
  );
}
