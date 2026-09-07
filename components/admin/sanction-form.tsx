"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { applySanction, createSanctionType, listInventory } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { InventoryItem, Profile, SanctionSeverity, SanctionType } from "@/types/database";

const SEVERITIES: SanctionSeverity[] = ["leve", "moderada", "grave", "muy grave", "extrema"];

export function SanctionForm({
  profiles,
  sanctionTypes,
}: {
  profiles: Profile[];
  sanctionTypes: SanctionType[];
}) {
  const [profileId, setProfileId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [severity, setSeverity] = useState<SanctionSeverity>("leve");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [pending, startTransition] = useTransition();
  const [inventory, setInventory] = useState<InventoryItem[] | null>(null);
  const [confiscateIds, setConfiscateIds] = useState<Set<string>>(new Set());

  const selectedType = useMemo(
    () => sanctionTypes.find((t) => t.id === typeId),
    [sanctionTypes, typeId]
  );

  // Reset the confiscation picker during render when the selected soldier
  // changes (React's "adjust state during render" pattern), then fetch that
  // soldier's inventory in an effect — keeps the effect body free of
  // synchronous setState calls.
  const [prevProfileId, setPrevProfileId] = useState(profileId);
  if (profileId !== prevProfileId) {
    setPrevProfileId(profileId);
    setConfiscateIds(new Set());
    setInventory(null);
  }

  useEffect(() => {
    if (!profileId) return;
    listInventory(profileId).then(setInventory);
  }, [profileId]);

  function toggleConfiscate(itemId: string) {
    setConfiscateIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function onTypeChange(id: string) {
    setTypeId(id);
    const t = sanctionTypes.find((s) => s.id === id);
    if (t) {
      setSeverity(t.severity);
      setDescription(t.label);
    }
  }

  function submit() {
    if (!profileId) {
      toast.error("Seleccioná un soldado.");
      return;
    }
    startTransition(async () => {
      const result = await applySanction({
        profileId,
        sanctionTypeId: typeId || null,
        severity,
        description,
        amountDeducted: amount ? Number(amount) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        confiscateInventoryIds: Array.from(confiscateIds),
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Sanción aplicada.");
        setProfileId("");
        setTypeId("");
        setDescription("");
        setAmount("");
        setExpiresAt("");
        setConfiscateIds(new Set());
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="mb-2 block">Soldado</Label>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar soldado" />
          </SelectTrigger>
          <SelectContent>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.callsign}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Tipo de sanción (catálogo)</Label>
        <Select value={typeId} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Elegir del catálogo (opcional)" />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((sev) => (
              <div key={sev}>
                {sanctionTypes
                  .filter((t) => t.severity === sev)
                  .map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      [{t.severity}] {t.label}
                    </SelectItem>
                  ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        {selectedType?.description && (
          <p className="mt-1 text-xs text-muted-foreground">{selectedType.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block">Severidad</Label>
          <Select value={severity} onValueChange={(v) => setSeverity(v as SanctionSeverity)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((sev) => (
                <SelectItem key={sev} value={sev}>
                  {sev}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Descuento en créditos (opcional)</Label>
          <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      </div>

      {profileId && (
        <div>
          <Label className="mb-2 block">Confiscar ítems del inventario (opcional)</Label>
          {inventory === null ? (
            <p className="text-xs text-muted-foreground">Cargando inventario...</p>
          ) : inventory.length === 0 ? (
            <p className="text-xs text-muted-foreground">Este soldado no tiene ítems en su inventario.</p>
          ) : (
            <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border border-border/60 p-2">
              {inventory.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-muted"
                >
                  <Checkbox
                    checked={confiscateIds.has(item.id)}
                    onCheckedChange={() => toggleConfiscate(item.id)}
                  />
                  <span className="flex-1">{item.item_name}</span>
                  <span className="text-xs text-muted-foreground">{formatCredits(item.purchase_price)}</span>
                </label>
              ))}
            </div>
          )}
          {confiscateIds.size > 0 && (
            <p className="mt-1 text-xs text-amber-500">
              {confiscateIds.size} ítem{confiscateIds.size === 1 ? "" : "s"} se van a borrar del
              inventario sin reembolso al aplicar esta sanción.
            </p>
          )}
        </div>
      )}

      <div>
        <Label className="mb-2 block">Vence el (opcional — vacío = sin vencimiento)</Label>
        <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-48" />
      </div>

      <div>
        <Label className="mb-2 block">Descripción</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>

      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? "Aplicando..." : "Aplicar sanción"}
      </Button>

      <NewSanctionTypeForm />
    </div>
  );
}

function NewSanctionTypeForm() {
  const [open, setOpen] = useState(false);
  const [severity, setSeverity] = useState<SanctionSeverity>("leve");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="link" className="self-start px-0" onClick={() => setOpen(true)}>
        + Agregar tipo de sanción al catálogo
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-border/60 p-4">
      <p className="mb-3 text-sm font-medium">Nuevo tipo de sanción</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={severity} onValueChange={(v) => setSeverity(v as SanctionSeverity)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEVERITIES.map((sev) => (
              <SelectItem key={sev} value={sev}>
                {sev}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Nombre" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>
      <Textarea
        className="mt-3"
        placeholder="Descripción (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <Button
        className="mt-3"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await createSanctionType({ severity, label, description });
            if (result?.error) toast.error(result.error);
            else {
              toast.success("Tipo de sanción agregado.");
              setLabel("");
              setDescription("");
              setOpen(false);
            }
          })
        }
      >
        Guardar en catálogo
      </Button>
    </div>
  );
}
