import type { Metadata } from "next";
import { getRecentTransactions } from "@/lib/data/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Movimientos — Mando G.O.C.S." };

const TXN_BADGE: Record<string, string> = {
  Sueldo: "bg-emerald-500/15 text-emerald-400",
  Bono: "bg-emerald-500/15 text-emerald-400",
  "Compra Armamento": "bg-primary/15 text-foreground",
  "Compra Vehiculo": "bg-primary/15 text-foreground",
  "Venta Armamento": "bg-emerald-500/15 text-emerald-400",
  "Venta Vehiculo": "bg-emerald-500/15 text-emerald-400",
  Descuento: "bg-destructive/15 text-destructive",
  Sancion: "bg-destructive/15 text-destructive",
  "Ajuste Manual": "bg-muted text-muted-foreground",
};

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Soldado</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Detalle</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(t.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {(t as unknown as { profile?: { callsign: string } }).profile?.callsign ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={TXN_BADGE[t.type] ?? ""} variant="secondary">
                      {t.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate">{t.detail ?? "—"}</TableCell>
                  <TableCell
                    className={`text-right font-medium tabular-nums ${
                      t.amount >= 0 ? "text-emerald-400" : "text-destructive"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatCredits(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
