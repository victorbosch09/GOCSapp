"use client";

import { useEffect, useMemo, useState, useTransition, type TransitionStartFunction } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import Link from "next/link";
import { toast } from "sonner";
import {
  approveProfile,
  approveAllPending,
  updateCallsign,
  updateProfileRank,
  updateProfileSquad,
  manualAdjustment,
  setCommandStaff,
  setInstructor,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  deleteProfile,
  listInventory,
} from "@/lib/actions/admin";
import { formatCredits, formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-provider";
import { downloadCsv } from "@/lib/csv";
import type { InventoryItem, Profile, Rank, Transaction, TransactionType } from "@/types/database";

type ProfileRow = Profile & { rank: Rank | null };

const PAGE_SIZE = 25;

const TXN_TYPES: TransactionType[] = [
  "Sueldo",
  "Bono",
  "Compra Armamento",
  "Compra Vehiculo",
  "Descuento",
  "Sancion",
  "Ajuste Manual",
];

type SortKey = "callsign" | "rango" | "escuadra" | "saldo";
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

export function SoldadosTable({
  profiles,
  ranks,
  currentProfileId,
}: {
  profiles: ProfileRow[];
  ranks: Rank[];
  currentProfileId: string;
}) {
  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("callsign");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [bulkPending, startBulkTransition] = useTransition();
  const confirm = useConfirm();
  const pendingCount = profiles.filter((p) => !p.approved).length;

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = profiles.filter((p) => {
      if (q && !p.callsign.toLowerCase().includes(q) && !(p.squad ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (rankFilter !== "all" && p.rank_id !== rankFilter) return false;
      if (statusFilter === "aprobado" && !p.approved) return false;
      if (statusFilter === "pendiente" && p.approved) return false;
      return true;
    });

    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "callsign") cmp = a.callsign.localeCompare(b.callsign);
      else if (sortKey === "rango")
        cmp = (a.rank?.sort_order ?? -1) - (b.rank?.sort_order ?? -1);
      else if (sortKey === "escuadra") cmp = (a.squad ?? "").localeCompare(b.squad ?? "");
      else if (sortKey === "saldo") cmp = a.cached_balance - b.cached_balance;
      return sortDir === "asc" ? cmp : -cmp;
    });

    return rows;
  }, [profiles, search, rankFilter, statusFilter, sortKey, sortDir]);

  // Reset to page 1 when the filters change, following React's "adjust
  // state during render" pattern instead of a useEffect (avoids an extra
  // render pass just to reset pagination).
  const filterKey = `${search}|${rankFilter}|${statusFilter}`;
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
        <div className="flex-1 min-w-[180px]">
          <Input
            placeholder="Buscar por callsign o escuadra..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <Select value={rankFilter} onValueChange={setRankFilter}>
          <SelectTrigger size="sm" className="w-[170px]">
            <SelectValue placeholder="Todos los rangos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los rangos</SelectItem>
            {ranks.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="aprobado">Aprobados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
          </SelectContent>
        </Select>
        {pendingCount > 0 && (
          <Button
            size="sm"
            disabled={bulkPending}
            onClick={async () => {
              if (
                !(await confirm({
                  title: `¿Aprobar a los ${pendingCount} operadores pendientes?`,
                  description: "Todos pasan a aprobados de una sola vez.",
                }))
              )
                return;
              startBulkTransition(async () => {
                const result = await approveAllPending();
                if (result?.error) toast.error(result.error);
                else toast.success(`${result.count ?? 0} operadores aprobados.`);
              });
            }}
          >
            {bulkPending ? "Aprobando..." : `Aprobar pendientes (${pendingCount})`}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            downloadCsv(
              `gocs-soldados-${new Date().toISOString().slice(0, 10)}.csv`,
              filtered.map((p) => ({
                callsign: p.callsign,
                rango: p.rank?.name ?? "",
                escuadra: p.squad ?? "",
                saldo: p.cached_balance,
                aprobado: p.approved ? "si" : "no",
                mando: p.is_command_staff ? "si" : "no",
                instructor: p.is_instructor ? "si" : "no",
                ingreso: p.join_date,
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
              <SortHeader label="Operador" sortKey="callsign" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Rango" sortKey="rango" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
              <SortHeader label="Escuadra" sortKey="escuadra" currentKey={sortKey} currentDir={sortDir} onSort={onSort} />
              <SortHeader
                label="Saldo"
                sortKey="saldo"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={onSort}
                className="text-right"
              />
              <TableHead>Estado</TableHead>
              <TableHead>Mando</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                  Ningún soldado coincide con el filtro.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((p) => (
                <SoldadoRow key={p.id} profile={p} ranks={ranks} currentProfileId={currentProfileId} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <PaginationControls
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        totalLabel={`${filtered.length} operador${filtered.length === 1 ? "" : "es"}`}
      />
    </div>
  );
}

function SoldadoRow({
  profile,
  ranks,
  currentProfileId,
}: {
  profile: ProfileRow;
  ranks: Rank[];
  currentProfileId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [squad, setSquad] = useState(profile.squad ?? "");
  const [callsign, setCallsign] = useState(profile.callsign);

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Input
          value={callsign}
          onChange={(e) => setCallsign(e.target.value)}
          onBlur={() => {
            const trimmed = callsign.trim();
            if (trimmed && trimmed !== profile.callsign) {
              startTransition(async () => {
                const result = await updateCallsign(profile.id, trimmed);
                if (result?.error) {
                  toast.error(result.error);
                  setCallsign(profile.callsign);
                } else {
                  toast.success("Callsign actualizado.");
                }
              });
            } else if (!trimmed) {
              setCallsign(profile.callsign);
            }
          }}
          className="h-8 w-36"
        />
      </TableCell>
      <TableCell>
        <Select
          defaultValue={profile.rank_id ?? undefined}
          onValueChange={(rankId) =>
            startTransition(async () => {
              const result = await updateProfileRank(profile.id, rankId);
              if (result?.error) toast.error(result.error);
            })
          }
        >
          <SelectTrigger size="sm" className="w-[170px]">
            <SelectValue placeholder="Sin rango" />
          </SelectTrigger>
          <SelectContent>
            {ranks.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name} ({r.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={squad}
          onChange={(e) => setSquad(e.target.value)}
          onBlur={() => {
            if (squad !== (profile.squad ?? "")) {
              startTransition(async () => {
                const result = await updateProfileSquad(profile.id, squad);
                if (result?.error) toast.error(result.error);
              });
            }
          }}
          placeholder="Escuadra"
          className="h-8 w-28"
        />
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {formatCredits(profile.cached_balance)}
      </TableCell>
      <TableCell>
        {profile.approved ? (
          <Badge variant="secondary">Aprobado</Badge>
        ) : (
          <Badge variant="outline">Pendiente</Badge>
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={profile.is_command_staff}
          disabled={pending || profile.id === currentProfileId}
          onCheckedChange={(checked) =>
            startTransition(async () => {
              const result = await setCommandStaff(profile.id, checked);
              if (result?.error) toast.error(result.error);
              else toast.success(checked ? "Mando otorgado." : "Mando revocado.");
            })
          }
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={profile.is_instructor}
          disabled={pending}
          onCheckedChange={(checked) =>
            startTransition(async () => {
              const result = await setInstructor(profile.id, checked);
              if (result?.error) toast.error(result.error);
              else toast.success(checked ? "Instructor otorgado." : "Instructor revocado.");
            })
          }
        />
      </TableCell>
      <TableCell className="flex justify-end gap-2">
        {!profile.approved && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await approveProfile(profile.id);
                if (result?.error) toast.error(result.error);
                else toast.success("Ingreso aprobado.");
              })
            }
          >
            Aprobar
          </Button>
        )}
        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/soldados/${profile.id}`}>Ver portal</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          title="Copiar ID interno"
          onClick={() => {
            navigator.clipboard.writeText(profile.id);
            toast.success("ID copiado.");
          }}
        >
          Copiar ID
        </Button>
        <AdjustmentDialog profileId={profile.id} callsign={profile.callsign} />
        <LedgerDialog profileId={profile.id} callsign={profile.callsign} />
        <InventoryDialog profileId={profile.id} callsign={profile.callsign} />
        {profile.id !== currentProfileId && (
          <DeleteAccountDialog profileId={profile.id} callsign={profile.callsign} pending={pending} startTransition={startTransition} />
        )}
      </TableCell>
    </TableRow>
  );
}

function DeleteAccountDialog({
  profileId,
  callsign,
  pending,
  startTransition,
}: {
  profileId: string;
  callsign: string;
  pending: boolean;
  startTransition: TransitionStartFunction;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const canDelete = confirmText.trim() === callsign;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setConfirmText("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive" disabled={pending}>
          Borrar cuenta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Borrar cuenta — {callsign}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Esto elimina el perfil, saldo, historial y acceso de <strong>{callsign}</strong>. No se puede
          deshacer. Escribí el callsign exacto para confirmar.
        </p>
        <Input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={callsign}
          autoFocus
        />
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={!canDelete || pending}
            onClick={() => {
              startTransition(async () => {
                const result = await deleteProfile(profileId);
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Cuenta borrada.");
                  setOpen(false);
                }
              });
            }}
          >
            {pending ? "Borrando..." : "Borrar definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdjustmentDialog({ profileId, callsign }: { profileId: string; callsign: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const parsed = Number(amount);
    if (!parsed) {
      toast.error("Ingresá un monto distinto de cero.");
      return;
    }
    startTransition(async () => {
      const result = await manualAdjustment(profileId, parsed, notes);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Ajuste aplicado.");
        setOpen(false);
        setAmount("");
        setNotes("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Ajustar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajuste manual — {callsign}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Monto (positivo = ingreso, negativo = egreso)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ej: 500 o -500"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Aplicando..." : "Aplicar ajuste"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowSkeletons({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function LedgerDialog({ profileId, callsign }: { profileId: string; callsign: string }) {
  const [open, setOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (open) {
      listTransactions(profileId).then(setTransactions);
    }
  }, [open, profileId]);

  function refresh() {
    listTransactions(profileId).then(setTransactions);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Movimientos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Libro de movimientos — {callsign}</DialogTitle>
        </DialogHeader>
        {transactions === null ? (
          <RowSkeletons />
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin movimientos.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {transactions.map((t) => (
              <TransactionRow
                key={t.id}
                txn={t}
                onChanged={() => startTransition(refresh)}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function InventoryDialog({ profileId, callsign }: { profileId: string; callsign: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<InventoryItem[] | null>(null);

  useEffect(() => {
    if (open) {
      listInventory(profileId).then(setItems);
    }
  }, [open, profileId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Inventario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inventario de {callsign}</DialogTitle>
        </DialogHeader>
        <p className="-mt-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
          Este es el inventario de <strong>{callsign}</strong>, no el tuyo. Tu propio inventario
          siempre está en tu Portal (/dashboard), separado de esta vista de mando.
        </p>
        {items === null ? (
          <RowSkeletons />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin ítems comprados todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.item_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.item_category ?? item.item_table} · Comprado el{" "}
                    {formatDate(item.acquired_at)}
                  </p>
                </div>
                <span className="shrink-0 text-muted-foreground">
                  {formatCredits(item.purchase_price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionRow({ txn, onChanged }: { txn: Transaction; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<TransactionType>(txn.type);
  const [amount, setAmount] = useState(String(txn.amount));
  const [detail, setDetail] = useState(txn.detail ?? "");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{txn.type}</Badge>
            <span className="truncate text-muted-foreground">{txn.detail ?? "—"}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(txn.created_at)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`font-medium tabular-nums ${txn.amount >= 0 ? "text-emerald-400" : "text-destructive"}`}
          >
            {txn.amount >= 0 ? "+" : ""}
            {formatCredits(txn.amount)}
          </span>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Editar
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              if (
                !(await confirm({
                  title: "¿Borrar este movimiento?",
                  description: "El saldo se recalcula automáticamente.",
                  destructive: true,
                }))
              )
                return;
              startTransition(async () => {
                const result = await deleteTransaction(txn.id);
                if (result?.error) toast.error(result.error);
                else onChanged();
              });
            }}
          >
            Borrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3 text-sm">
      <div className="grid gap-2 sm:grid-cols-3">
        <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
          <SelectTrigger size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TXN_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Detalle" />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
        <Button
          size="sm"
          disabled={pending}
          onClick={() => {
            const parsedAmount = Number(amount);
            if (Number.isNaN(parsedAmount)) {
              toast.error("Monto inválido.");
              return;
            }
            startTransition(async () => {
              const result = await updateTransaction(txn.id, {
                type,
                amount: parsedAmount,
                detail,
              });
              if (result?.error) toast.error(result.error);
              else {
                toast.success("Movimiento actualizado.");
                setEditing(false);
                onChanged();
              }
            });
          }}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
