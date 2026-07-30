"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSanction, deleteSanction } from "@/lib/actions/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Sanction, SanctionSeverity } from "@/types/database";

const SEVERITIES: SanctionSeverity[] = ["leve", "moderada", "grave", "muy grave", "extrema"];

type SanctionWithProfile = Sanction & { profile?: { callsign: string } | null };

export function SanctionList({ sanctions }: { sanctions: SanctionWithProfile[] }) {
  if (sanctions.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin sanciones registradas todavía.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {sanctions.map((s) => (
        <SanctionRow key={s.id} sanction={s} />
      ))}
    </div>
  );
}

function SanctionRow({ sanction }: { sanction: SanctionWithProfile }) {
  const [editing, setEditing] = useState(false);
  const [severity, setSeverity] = useState(sanction.severity);
  const [description, setDescription] = useState(sanction.description ?? "");
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3 text-sm">
        <Select value={severity} onValueChange={(v) => setSeverity(v as SanctionSeverity)}>
          <SelectTrigger className="w-48">
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
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await updateSanction(sanction.id, { severity, description });
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Sanción actualizada.");
                  setEditing(false);
                }
              })
            }
          >
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{sanction.profile?.callsign ?? "—"}</span>
          <Badge variant="outline">{sanction.severity}</Badge>
        </div>
        <p className="truncate text-muted-foreground">{sanction.description ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{formatDateTime(sanction.applied_at)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {sanction.amount_deducted ? (
          <span className="font-medium text-destructive">
            -{formatCredits(sanction.amount_deducted)}
          </span>
        ) : null}
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm("¿Borrar esta sanción? Si tenía descuento, también se revierte el saldo."))
              return;
            startTransition(async () => {
              const result = await deleteSanction(sanction.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          Borrar
        </Button>
      </div>
    </div>
  );
}
