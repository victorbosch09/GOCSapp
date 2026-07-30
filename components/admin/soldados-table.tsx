"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approveProfile,
  updateProfileRank,
  updateProfileSquad,
  manualAdjustment,
  setCommandStaff,
  setInstructor,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  deleteProfile,
} from "@/lib/actions/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
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
import type { Profile, Rank, Transaction, TransactionType } from "@/types/database";

type ProfileRow = Profile & { rank: Rank | null };

const TXN_TYPES: TransactionType[] = [
  "Sueldo",
  "Bono",
  "Compra Armamento",
  "Compra Vehiculo",
  "Descuento",
  "Sancion",
  "Ajuste Manual",
];

export function SoldadosTable({
  profiles,
  ranks,
  currentProfileId,
}: {
  profiles: ProfileRow[];
  ranks: Rank[];
  currentProfileId: string;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Operador</TableHead>
          <TableHead>Rango</TableHead>
          <TableHead>Escuadra</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Mando</TableHead>
          <TableHead>Instructor</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((p) => (
          <SoldadoRow key={p.id} profile={p} ranks={ranks} currentProfileId={currentProfileId} />
        ))}
      </TableBody>
    </Table>
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

  return (
    <TableRow>
      <TableCell className="font-medium">{profile.callsign}</TableCell>
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
        <AdjustmentDialog profileId={profile.id} callsign={profile.callsign} />
        <LedgerDialog profileId={profile.id} callsign={profile.callsign} />
        {profile.id !== currentProfileId && (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() => {
              if (
                !confirm(
                  `¿Borrar definitivamente la cuenta de ${profile.callsign}? Esto elimina su perfil, saldo, historial y acceso. No se puede deshacer.`
                )
              )
                return;
              startTransition(async () => {
                const result = await deleteProfile(profile.id);
                if (result?.error) toast.error(result.error);
                else toast.success("Cuenta borrada.");
              });
            }}
          >
            Borrar cuenta
          </Button>
        )}
      </TableCell>
    </TableRow>
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
          <p className="text-sm text-muted-foreground">Cargando...</p>
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

function TransactionRow({ txn, onChanged }: { txn: Transaction; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<TransactionType>(txn.type);
  const [amount, setAmount] = useState(String(txn.amount));
  const [detail, setDetail] = useState(txn.detail ?? "");
  const [pending, startTransition] = useTransition();

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
            onClick={() => {
              if (!confirm("¿Borrar este movimiento? El saldo se recalcula automáticamente.")) return;
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
