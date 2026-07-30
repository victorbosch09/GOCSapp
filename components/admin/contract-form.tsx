"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { logContract } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ContractBonusType, ContractRiskLevel, Profile } from "@/types/database";

export function ContractForm({
  profiles,
  bonusTypes,
  riskLevels,
}: {
  profiles: Profile[];
  bonusTypes: ContractBonusType[];
  riskLevels: ContractRiskLevel[];
}) {
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [selectedBonuses, setSelectedBonuses] = useState<Set<string>>(new Set());
  const [riskLevel, setRiskLevel] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const total = useMemo(
    () =>
      bonusTypes
        .filter((b) => selectedBonuses.has(b.label))
        .reduce((sum, b) => sum + b.amount, 0),
    [bonusTypes, selectedBonuses]
  );

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  }

  function submit() {
    startTransition(async () => {
      const result = await logContract({
        profileIds: Array.from(selectedProfiles),
        riskLevel: riskLevel ? Number(riskLevel) : null,
        bonusLabels: Array.from(selectedBonuses),
        notes,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Contrato cargado: ${formatCredits(total)} por soldado.`);
        setSelectedProfiles(new Set());
        setSelectedBonuses(new Set());
        setRiskLevel("");
        setNotes("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label className="mb-2 block">Soldados en el contrato</Label>
        <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto rounded-md border border-border/60 p-3 sm:grid-cols-3">
          {profiles.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedProfiles.has(p.id)}
                onCheckedChange={() => toggle(selectedProfiles, setSelectedProfiles, p.id)}
              />
              {p.callsign}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Nivel de riesgo (informativo)</Label>
        <Select value={riskLevel} onValueChange={setRiskLevel}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Sin especificar" />
          </SelectTrigger>
          <SelectContent>
            {riskLevels.map((r) => (
              <SelectItem key={r.id} value={String(r.level)}>
                Nivel {r.level} ({(r.percentage * 100).toFixed(0)}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Bonos obtenidos</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {bonusTypes.map((b) => (
            <label key={b.label} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selectedBonuses.has(b.label)}
                onCheckedChange={() => toggle(selectedBonuses, setSelectedBonuses, b.label)}
              />
              {b.label} ({formatCredits(b.amount)})
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
        <span className="text-sm text-muted-foreground">
          Total por soldado seleccionado ({selectedProfiles.size})
        </span>
        <span className="font-heading text-lg text-gocs-red">{formatCredits(total)}</span>
      </div>

      <Button
        onClick={submit}
        disabled={pending || selectedProfiles.size === 0 || total <= 0}
        className="self-start"
      >
        {pending ? "Cargando..." : "Cargar contrato"}
      </Button>
    </div>
  );
}
