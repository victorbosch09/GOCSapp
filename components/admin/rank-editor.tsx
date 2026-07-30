"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRank } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Rank } from "@/types/database";

export function RankEditor({ ranks }: { ranks: Rank[] }) {
  return (
    <div className="flex flex-col gap-4">
      {ranks.map((rank) => (
        <RankCard key={rank.id} rank={rank} />
      ))}
    </div>
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
            onChange={(e) => {
              setWage(e.target.value);
              setDirty(true);
            }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Descripción</Label>
          <Textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDirty(true);
            }}
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Requisito de ascenso</Label>
          <Textarea
            value={requirement}
            onChange={(e) => {
              setRequirement(e.target.value);
              setDirty(true);
            }}
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
