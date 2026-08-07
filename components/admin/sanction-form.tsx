"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { applySanction, createSanctionType } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Profile, SanctionSeverity, SanctionType } from "@/types/database";

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

  const selectedType = useMemo(
    () => sanctionTypes.find((t) => t.id === typeId),
    [sanctionTypes, typeId]
  );

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
