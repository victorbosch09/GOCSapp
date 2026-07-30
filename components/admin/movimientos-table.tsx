"use client";

import { downloadCsv } from "@/lib/csv";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Transaction } from "@/types/database";

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

type TxnWithProfile = Transaction & { profile?: { callsign: string } | null };

export function MovimientosTable({ transactions }: { transactions: TxnWithProfile[] }) {
  return (
    <div className="flex flex-col gap-3">
      <Button
        size="sm"
        variant="outline"
        className="self-end"
        onClick={() =>
          downloadCsv(
            `gocs-movimientos-${new Date().toISOString().slice(0, 10)}.csv`,
            transactions.map((t) => ({
              fecha: t.created_at,
              soldado: t.profile?.callsign ?? "",
              tipo: t.type,
              detalle: t.detail ?? "",
              monto: t.amount,
            }))
          )
        }
      >
        Exportar CSV
      </Button>
      <div className="overflow-x-auto">
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
                <TableCell className="font-medium">{t.profile?.callsign ?? "—"}</TableCell>
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
      </div>
    </div>
  );
}
