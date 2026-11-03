import type { Metadata } from "next";
import { getExpensesData } from "@/lib/data/mercado";
import { ExpensesPanel } from "@/components/admin/expenses-panel";

export const metadata: Metadata = { title: "Gastos Recurrentes — Mando G.O.C.S." };

export default async function AdminGastosPage() {
  let data: Awaited<ReturnType<typeof getExpensesData>> | null = null;
  let migrationPending = false;
  try {
    data = await getExpensesData();
  } catch {
    migrationPending = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Gastos Recurrentes</h1>
        <p className="text-muted-foreground text-sm">
          Costos operativos del clan. Seguros, infraestructura, logística e inteligencia.
          Los montos marcados con escala dependen del personal activo y el inventario en uso.
        </p>
      </div>
      {migrationPending && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-400">
          <strong className="font-semibold">Migración pendiente.</strong> Las tablas de gastos no existen aún. Ejecutá{" "}
          <code className="font-mono text-xs">supabase/migrations/20260101000040_mercado_gastos.sql</code>{" "}
          en el SQL Editor de Supabase para habilitar esta sección.
        </div>
      )}
      {data && (
        <ExpensesPanel
          expenses={data.expenses}
          payments={data.payments as never}
          soldierCount={data.soldierCount}
          totalVehicleStock={data.totalVehicleStock}
          totalWeaponStock={data.totalWeaponStock}
        />
      )}
    </div>
  );
}
