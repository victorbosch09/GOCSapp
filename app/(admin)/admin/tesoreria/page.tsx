import type { Metadata } from "next";
import { getTreasury, getTreasuryTransactions } from "@/lib/data/treasury";
import { TreasuryPanel } from "@/components/admin/treasury-panel";

export const metadata: Metadata = { title: "Tesorería — Mando G.O.C.S." };

export default async function AdminTesoreriaPage() {
  const [treasury, transactions] = await Promise.all([getTreasury(), getTreasuryTransactions()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Tesorería del GOCS</h1>
        <p className="text-muted-foreground">
          Presupuesto general de la organización — separado de los saldos individuales. De acá
          sale la nómina semanal y los gastos de armamento/generales.
        </p>
      </div>
      {treasury && <TreasuryPanel treasury={treasury} transactions={transactions} />}
    </div>
  );
}
