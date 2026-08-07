"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrainingMaterial } from "@/types/database";

export function MaterialsList({ materials }: { materials: TrainingMaterial[] }) {
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(materials.map((m) => m.category).filter((c): c is string => !!c))),
    [materials]
  );

  const visible = category ? materials.filter((m) => m.category === category) : materials;

  if (materials.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay material cargado.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={category === null ? "default" : "outline"} onClick={() => setCategory(null)}>
            Todas
          </Button>
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2">
        {visible.map((m) => (
          <a
            key={m.id}
            href={m.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border/60 p-3 text-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{m.title}</span>
              {m.category && <Badge variant="secondary">{m.category}</Badge>}
            </div>
            {m.description && <p className="mt-1 text-muted-foreground">{m.description}</p>}
          </a>
        ))}
      </div>
    </div>
  );
}
