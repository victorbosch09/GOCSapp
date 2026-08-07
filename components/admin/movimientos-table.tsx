"use client";

import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Transaction, TransactionType } from "@/types/database";

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

const TXN_TYPES: TransactionType[] = [
  "Sueldo",
  "Bono",
  "Compra Armamento",
  "Compra Vehiculo",
  "Venta Armamento",
  "Venta Vehiculo",
  "Descuento",
  "Sancion",
  "Ajuste Manual",
];

type TxnWithProfile = Transaction & { profile?: { callsign: string } | null };
type SortKey = "fecha" | "soldado" | "monto";
type SortDir = "asc" | "desc";

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
      >
        {label}
        {active && <span className="text-xs">{currentDir === "asc" ? "▲" : "▼"}</span>}
      </button>
    </TableHead>
  );
}

export function MovimientosTable({ transactions }: { transactions: TxnWithProfile[] }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "fecha" ? "desc" : "asc");
    }
  }

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom + "T00:00:00") : null;
    const to = dateTo ? new Date(dateTo + "T23:59:59") : null;

    let rows = transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      const created = new Date(t.created_at);
      if (from && created < from) return false;
      if (to && created > to) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "fecha") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      else if (sortKey === "soldado")
        cmp = (a.profile?.callsign ?? "").localeCompare(b.profile?.callsign ?? "");
      else if (sortKey === "monto") cmp = a.amount - b.amount;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [transactions, typeFilter, dateFrom, dateTo, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger size="sm" className="w-[180px]">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {TXN_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Desde</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Hasta</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9 w-40" />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() =>
            downloadCsv(
              `gocs-movimientos-${new Date().toISOString().slice(0, 10)}.csv`,
              filtered.map((t) => ({
                fecha: t.created_at,
                soldado: t.profile?.callsign ?? "",
                tipo: t.type,
                detalle: t.detail ?? "",
                monto: t.amount,
              }))
            )
          }
        >
          Exportar CSV ({filtered.length})
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader label="Fecha" sortKey="fecha" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Soldado" sortKey="soldado" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
              <TableHead>Tipo</TableHead>
              <TableHead>Detalle</TableHead>
              <SortHeader
                label="Monto"
                sortKey="monto"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={onSort}
                className="text-right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                  Ningún movimiento coincide con el filtro.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
