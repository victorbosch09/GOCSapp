import type { Metadata } from "next";
import { getMarketData } from "@/lib/data/mercado";
import { MarketPanel } from "@/components/admin/market-panel";

export const metadata: Metadata = { title: "Mercado Internacional — Mando G.O.C.S." };

export default async function AdminMercadoPage() {
  const data = await getMarketData();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Mercado Internacional</h1>
        <p className="text-muted-foreground text-sm">
          Adquisición de armamento, vehículos y equipamiento a precio mayorista. Los pagos se
          descuentan de la tesorería del clan. Solo visible para Mando.
        </p>
      </div>
      <MarketPanel
        marketItems={data.marketItems}
        purchases={data.purchases as never}
        storeItems={data.storeItems}
      />
    </div>
  );
}
