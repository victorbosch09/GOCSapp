"use client";

import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationControls } from "@/components/ui/pagination-controls";
import type { AdminAuditLog } from "@/types/database";

type AuditRow = AdminAuditLog & {
  actor: { callsign: string } | null;
  target: { callsign: string } | null;
};

const PAGE_SIZE = 25;

const ACTION_LABEL: Record<string, string> = {
  rename_callsign: "Cambio de callsign",
  grant_command_staff: "Otorgó mando",
  revoke_command_staff: "Revocó mando",
  manual_adjustment: "Ajuste manual",
  delete_profile: "Borró cuenta",
  edit_transaction: "Editó movimiento",
  delete_transaction: "Borró movimiento",
  bulk_approve: "Aprobación masiva",
};

export function AuditLogTable({ entries }: { entries: AuditRow[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const actions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (
        q &&
        !(e.actor?.callsign ?? "").toLowerCase().includes(q) &&
        !(e.target?.callsign ?? "").toLowerCase().includes(q) &&
        !(e.detail ?? "").toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [entries, search, actionFilter]);

  const filterKey = `${search}|${actionFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <Input
            placeholder="Buscar por operador o detalle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger size="sm" className="w-[200px]">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las acciones</SelectItem>
            {actions.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABEL[a] ?? a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            downloadCsv(
              `gocs-auditoria-${new Date().toISOString().slice(0, 10)}.csv`,
              filtered.map((e) => ({
                fecha: e.created_at,
                accion: e.action,
                actor: e.actor?.callsign ?? "",
                objetivo: e.target?.callsign ?? "",
                detalle: e.detail ?? "",
              }))
            )
          }
        >
          Exportar CSV ({filtered.length})
        </Button>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ningún registro coincide con el filtro.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {paged.map((e) => (
            <div key={e.id} className="rounded-md border border-border/60 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{ACTION_LABEL[e.action] ?? e.action}</Badge>
                <span className="font-medium">{e.actor?.callsign ?? "—"}</span>
                {e.target?.callsign && (
                  <span className="text-muted-foreground">→ {e.target.callsign}</span>
                )}
              </div>
              {e.detail && <p className="mt-1 text-muted-foreground">{e.detail}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
            </div>
          ))}
        </div>
      )}
      <PaginationControls
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalLabel={`${filtered.length} registro${filtered.length === 1 ? "" : "s"}`}
      />
    </div>
  );
}
