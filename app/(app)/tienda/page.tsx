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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">Tienda</h1>
          <p className="text-muted-foreground">
            Armamento, equipamiento, accesorios y vehículos del clan.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Tu saldo</p>
          <p className="font-heading text-2xl text-gocs-red">
            {formatCredits(profile.cached_balance)}
          </p>
        </div>
      </div>

      <CatalogTabs
        initial={catalog}
        balance={profile.cached_balance}
        canBuy={profile.approved}
      />
    </div>
  );
}
