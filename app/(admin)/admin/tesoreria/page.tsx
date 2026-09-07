import type { Metadata } from "next";
import { getTreasury, getTreasuryTransactions, getTreasuryBalanceHistory } from "@/lib/data/treasury";
import { formatCredits, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendChart } from "@/components/ui/trend-chart";
import { TreasuryPanel } from "@/components/admin/treasury-panel";

export const metadata: Metadata = { title: "Tesorería — Mando G.O.C.S." };

export default async function AdminTesoreriaPage() {
  const [treasury, transactions, balanceHistory] = await Promise.all([
    getTreasury(),
    getTreasuryTransactions(),
    getTreasuryBalanceHistory(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Tesorería del GOCS</h1>
        <p className="text-muted-foreground">
          Presupuesto general de la organización — separado de los saldos individuales. De acá
          sale la nómina semanal y los gastos de armamento/generales.
        </p>
      </div>
      {balanceHistory.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Evolución del saldo</CardTitle>
            <CardDescription>Balance acumulado semana a semana desde el primer movimiento.</CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart
              mode="line"
              data={balanceHistory.map((w) => ({ label: formatDate(w.weekOf), value: w.balance }))}
              formatValue={(v) => formatCredits(v)}
            />
          </CardContent>
        </Card>
      )}
      {treasury && <TreasuryPanel treasury={treasury} transactions={transactions} />}
    </div>
  );
}
