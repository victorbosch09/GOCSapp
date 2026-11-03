import type { Metadata } from "next";
import { getExpensesData } from "@/lib/data/mercado";
import { ExpensesPanel } from "@/components/admin/expenses-panel";

export const metadata: Metadata = { title: "Gastos Recurrentes — Mando G.O.C.S." };

export default async function AdminGastosPage() {
  const data = await getExpensesData();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Gastos Recurrentes</h1>
        <p className="text-muted-foreground text-sm">
          Costos operativos del clan. Seguros, infraestructura, logística e inteligencia.
          Los montos marcados con escala dependen del personal activo y el inventario en uso.
        </p>
      </div>
      <ExpensesPanel
        expenses={data.expenses}
        payments={data.payments as never}
        soldierCount={data.soldierCount}
        totalVehicleStock={data.totalVehicleStock}
        totalWeaponStock={data.totalWeaponStock}
      />
    </div>
  );
}
