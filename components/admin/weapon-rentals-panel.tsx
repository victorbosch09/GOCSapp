"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createWeaponRental, returnWeaponRental } from "@/lib/actions/admin";
import type { WeaponRental } from "@/types/database";

type Profile = { id: string; callsign: string };

type RentalRow = WeaponRental & {
  borrower?: { callsign: string } | null;
  lender?: { callsign: string } | null;
};

const CATEGORIES = ["weapons", "vehicles", "equipment", "accessories"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  weapons: "Arma",
  vehicles: "Vehículo",
  equipment: "Equipo",
  accessories: "Accesorio",
};

function statusBadge(status: string, expiresAt: string) {
  const expired = new Date(expiresAt) < new Date();
  if (status === "returned") return <Badge variant="outline" className="text-xs text-muted-foreground">Devuelto</Badge>;
  if (status === "expired" || expired) return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
  return <Badge className="text-xs bg-emerald-600/20 text-emerald-400 border-emerald-600/30">Activo</Badge>;
}

export function WeaponRentalsPanel({
  rentals,
  profiles,
}: {
  rentals: RentalRow[];
  profiles: Profile[];
}) {
  const [profileId, setProfileId] = useState("");
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState<string>("weapons");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [rentalFee, setRentalFee] = useState("0");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!profileId) { toast.error("Seleccioná un operador."); return; }
    if (!itemName.trim()) { toast.error("Indicá el nombre del ítem."); return; }
    if (!expiresAt) { toast.error("Seleccioná una fecha de vencimiento."); return; }
    startTransition(async () => {
      const r = await createWeaponRental({
        profileId,
        itemName,
        itemCategory: category,
        notes: notes || undefined,
        expiresAt: new Date(expiresAt).toISOString(),
        rentalFee: Number(rentalFee) || 0,
      });
      if (r.error) { toast.error(r.error); return; }
      toast.success("Renta registrada.");
      setProfileId(""); setItemName(""); setNotes(""); setExpiresAt(""); setRentalFee("0");
    });
  }

  const active = rentals.filter((r) => r.status === "active" && new Date(r.expires_at) >= new Date());
  const other = rentals.filter((r) => r.status !== "active" || new Date(r.expires_at) < new Date());

  return (
    <div className="flex flex-col gap-6">
      {/* New rental form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Registrar nueva renta</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Operador</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Seleccioná un operador…" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.callsign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Ítem (nombre)</Label>
              <Input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="ej. RPG-7, Prowler…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Fecha de vencimiento</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Depósito (cr, opcional)</Label>
              <Input type="number" min={0} value={rentalFee} onChange={(e) => setRentalFee(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Notas</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condición, detalles…" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={pending} size="sm" className="bg-primary text-primary-foreground">
              {pending ? "Registrando…" : "Registrar renta"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active rentals */}
      {active.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Rentas activas</p>
          {active.map((r) => (
            <RentalRow key={r.id} rental={r} />
          ))}
        </div>
      )}

      {/* Historical */}
      {other.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Historial</p>
          {other.map((r) => (
            <RentalRow key={r.id} rental={r} />
          ))}
        </div>
      )}

      {rentals.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No hay rentas registradas.</p>
      )}
    </div>
  );
}

function RentalRow({ rental }: { rental: RentalRow }) {
  const [pending, startTransition] = useTransition();

  function markReturned() {
    startTransition(async () => {
      const r = await returnWeaponRental(rental.id);
      if (r.error) toast.error(r.error);
      else toast.success("Marcado como devuelto.");
    });
  }

  const expiryDate = new Date(rental.expires_at);
  const isExpired = expiryDate < new Date();

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{rental.item_name}</span>
          <span className="text-xs text-muted-foreground capitalize">{CATEGORY_LABELS[rental.item_category] ?? rental.item_category}</span>
          {statusBadge(rental.status, rental.expires_at)}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3 flex-wrap">
          <span>Operador: <span className="text-foreground">{rental.borrower?.callsign ?? rental.profile_id}</span></span>
          <span>Prestado por: <span className="text-foreground">{rental.lender?.callsign ?? rental.lent_by_id}</span></span>
          <span className={isExpired && rental.status === "active" ? "text-destructive" : ""}>
            Vence: {expiryDate.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          {rental.rental_fee > 0 && <span>Depósito: {rental.rental_fee} cr</span>}
          {rental.notes && <span>Nota: {rental.notes}</span>}
        </div>
      </div>
      {rental.status === "active" && (
        <Button size="sm" variant="outline" onClick={markReturned} disabled={pending} className="shrink-0 text-xs">
          {pending ? "…" : "Devuelto"}
        </Button>
      )}
    </div>
  );
}
