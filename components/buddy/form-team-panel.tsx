"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { formBuddyTeam } from "@/lib/actions/buddy";
import type { BuddyProfile } from "@/lib/data/buddy";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function FormTeamPanel({ candidates }: { candidates: BuddyProfile[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="font-heading text-base">🤝 Formar equipo</CardTitle>
        <CardDescription>
          Elegí con qué otro Operador lvl1 querés hacer equipo para adoptar un aspirante.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay otros Operadores lvl1 disponibles para formar equipo ahora mismo.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-center transition-colors ${
                  selected === c.id ? "border-gocs-red bg-primary/10" : "border-border/60 hover:bg-muted"
                }`}
              >
                <Avatar>
                  {c.avatar_url && <AvatarImage src={c.avatar_url} alt={c.callsign} />}
                  <AvatarFallback>{c.callsign.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{c.callsign}</span>
              </button>
            ))}
          </div>
        )}
        <Button
          className="self-start"
          disabled={!selected || pending}
          onClick={() =>
            startTransition(async () => {
              if (!selected) return;
              const result = await formBuddyTeam(selected);
              if (result?.error) toast.error(result.error);
              else {
                toast.success("Equipo formado.");
                setSelected(null);
              }
            })
          }
        >
          Formar equipo
        </Button>
      </CardContent>
    </Card>
  );
}
