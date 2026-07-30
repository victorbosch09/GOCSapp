import type { Metadata } from "next";
import { getRecentTransactions } from "@/lib/data/admin";
import { Card, CardContent } from "@/components/ui/card";
import { MovimientosTable } from "@/components/admin/movimientos-table";

export const metadata: Metadata = { title: "Movimientos — Mando G.O.C.S." };

export default async function AdminMovimientosPage() {
  const transactions = await getRecentTransactions(60);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Movimientos del clan</h1>
        <p className="text-muted-foreground">
          Últimos {transactions.length} movimientos de todos los soldados — quién compró, vendió,
          cobró o recibió un descuento. Para editar o borrar un movimiento puntual, andá al soldado
          en /admin/soldados → Movimientos.
        </p>
      </div>
      <Card>
        <CardContent className="pt-6">
          <MovimientosTable transactions={transactions} />
        </CardContent>
      </Card>
    </div>
  );
}
