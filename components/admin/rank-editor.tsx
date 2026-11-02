"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRank, createRank } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { Rank } from "@/types/database";

export function RankEditor({ ranks }: { ranks: Rank[] }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNew((v) => !v)}
          className="gap-2"
        >
          <Plus size={14} />
          Nuevo rango
          {showNew ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>

      {showNew && (
        <NewRankForm
          nextSortOrder={Math.max(0, ...ranks.map((r) => r.sort_order)) + 10}
          onCreated={() => setShowNew(false)}
        />
      )}

      {ranks.map((rank) => (
        <RankCard key={rank.id} rank={rank} />
      ))}
    </div>
  );
}

function NewRankForm({
  nextSortOrder,
  onCreated,
}: {
  nextSortOrder: number;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [wage, setWage] = useState("0");
  const [description, setDescription] = useState("");
  const [requirement, setRequirement] = useState("");
  const [sortOrder, setSortOrder] = useState(String(nextSortOrder));
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) { toast.error("El nombre es requerido."); return; }
    if (!abbreviation.trim()) { toast.error("La abreviatura es requerida."); return; }
    const parsedWage = Number(wage);
    if (Number.isNaN(parsedWage) || parsedWage < 0) { toast.error("Sueldo inválido."); return; }
    const parsedSort = Number(sortOrder);
    if (Number.isNaN(parsedSort)) { toast.error("Orden inválido."); return; }

    startTransition(async () => {
      const result = await createRank({
        name: name.trim(),
        abbreviation: abbreviation.trim(),
        weekly_wage: parsedWage,
        description: description.trim(),
        promotion_requirement: requirement.trim(),
        sort_order: parsedSort,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Rango "${name}" creado.`);
        onCreated();
      }
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base text-primary">Nuevo rango</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-2">
            <Label>Nombre</Label>
            <Input
              placeholder="ej. Operador LVL2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Abreviatura</Label>
            <Input
              placeholder="ej. ON-2"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              className="uppercase"
              maxLength={10}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Sueldo semanal (cr)</Label>
            <Input
              type="number"
              min={0}
              value={wage}
              onChange={(e) => setWage(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Orden (sort_order)</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Descripción</Label>
          <Textarea
            placeholder="Breve descripción del rango..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Requisito de ascenso</Label>
          <Textarea
            placeholder="ej. Mod 1-6 y 8 contratos cumplidos."
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={pending} className="gap-2">
            <Plus size={14} />
            {pending ? "Creando..." : "Crear rango"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RankCard({ rank }: { rank: Rank }) {
  const [wage, setWage] = useState(String(rank.weekly_wage));
  const [description, setDescription] = useState(rank.description ?? "");
  const [requirement, setRequirement] = useState(rank.promotion_requirement ?? "");
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  function save() {
    const parsedWage = Number(wage);
    if (Number.isNaN(parsedWage) || parsedWage < 0) {
      toast.error("Sueldo inválido.");
      return;
    }
    startTransition(async () => {
      const result = await updateRank(rank.id, {
        weekly_wage: parsedWage,
        description,
        promotion_requirement: requirement,
      });
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`${rank.name} actualizado.`);
        setDirty(false);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">
          {rank.name} <span className="text-muted-foreground">({rank.abbreviation})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Sueldo semanal (cr)</Label>
          <Input
            type="number"
            value={wage}
            onChange={(e) => { setWage(e.target.value); setDirty(true); }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Requisito de ascenso</Label>
          <Textarea
            value={requirement}
            onChange={(e) => { setRequirement(e.target.value); setDirty(true); }}
            rows={2}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Sueldo actual: {formatCredits(rank.weekly_wage)}
          </span>
          <Button size="sm" disabled={!dirty || pending} onClick={save}>
            {pending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
