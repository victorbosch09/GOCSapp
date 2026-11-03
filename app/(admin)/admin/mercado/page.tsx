import type { Metadata } from "next";
import { getMarketData } from "@/lib/data/mercado";
import { MarketPanel } from "@/components/admin/market-panel";

export const metadata: Metadata = { title: "Mercado Internacional — Mando G.O.C.S." };

export default async function AdminMercadoPage() {
  let data: Awaited<ReturnType<typeof getMarketData>> | null = null;
  let migrationPending = false;
  try {
    data = await getMarketData();
  } catch {
    migrationPending = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Mercado Internacional</h1>
        <p className="text-muted-foreground text-sm">
          Adquisición de armamento, vehículos y equipamiento a precio mayorista. Los pagos se
          descuentan de la tesorería del clan. Solo visible para Mando.
        </p>
      </div>
      {migrationPending && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-400">
          <strong className="font-semibold">Migración pendiente.</strong> La tabla{" "}
          <code className="font-mono text-xs">market_items</code> no existe aún. Ejecutá el archivo{" "}
          <code className="font-mono text-xs">supabase/migrations/20260101000040_mercado_gastos.sql</code>{" "}
          en el SQL Editor de Supabase para habilitar esta sección.
        </div>
      )}
      {data && (
        <MarketPanel
          marketItems={data.marketItems}
          purchases={data.purchases as never}
          storeItems={data.storeItems}
        />
      )}
    </div>
  );
}
