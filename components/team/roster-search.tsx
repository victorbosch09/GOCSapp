"use client";

import { useMemo, useState } from "react";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GocsPatch } from "@/components/brand/logo";
import type { RosterEntry } from "@/types/database";

export function RosterSearch({ roster }: { roster: RosterEntry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (r) =>
        r.callsign.toLowerCase().includes(q) ||
        (r.squad ?? "").toLowerCase().includes(q) ||
        (r.rank_name ?? "").toLowerCase().includes(q)
    );
  }, [roster, query]);

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Buscar por callsign, rango o escuadra..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Operador</TableHead>
            <TableHead>Rango</TableHead>
            <TableHead>Escuadra</TableHead>
            <TableHead className="text-right">Ingreso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="flex items-center gap-2 font-medium">
                <GocsPatch size={24} />
                {r.callsign}
                {r.is_command_staff && (
                  <Badge variant="secondary" className="text-gocs-red">
                    Mando
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {r.rank_name ?? "—"}
                {r.rank_abbreviation ? ` (${r.rank_abbreviation})` : ""}
              </TableCell>
              <TableCell>{r.squad ?? "—"}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatDate(r.join_date)}
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                Sin resultados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
