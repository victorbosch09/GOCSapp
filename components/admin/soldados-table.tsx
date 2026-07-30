"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { approveProfile, updateProfileRank, updateProfileSquad, manualAdjustment } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/data/dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { Profile, Rank } from "@/types/database";

type ProfileRow = Profile & { rank: Rank | null };

export function SoldadosTable({ profiles, ranks }: { profiles: ProfileRow[]; ranks: Rank[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Operador</TableHead>
          <TableHead>Rango</TableHead>
          <TableHead>Escuadra</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((p) => (
          <SoldadoRow key={p.id} profile={p} ranks={ranks} />
        ))}
      </TableBody>
    </Table>
  );
}

function SoldadoRow({ profile, ranks }: { profile: ProfileRow; ranks: Rank[] }) {
  const [pending, startTransition] = useTransition();
  const [squad, setSquad] = useState(profile.squad ?? "");

  return (
    <TableRow>
      <TableCell className="font-medium">
        {profile.callsign}
        {profile.is_command_staff && (
          <Badge variant="secondary" className="ml-2 text-gocs-red">
            Mando
          </Badge>
        )}
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
          Ajustar saldo
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
