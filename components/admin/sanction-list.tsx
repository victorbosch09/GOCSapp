"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateSanction, deleteSanction } from "@/lib/actions/admin";
import { useNow } from "@/lib/hooks/use-now";
import { useConfirm } from "@/components/ui/confirm-provider";
import { downloadCsv } from "@/lib/csv";
import { formatCredits, formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
      <Button
        size="sm"
        variant="outline"
        className="self-end"
        onClick={() =>
          downloadCsv(
            `gocs-sanciones-${new Date().toISOString().slice(0, 10)}.csv`,
            sanctions.map((s) => ({
              fecha: s.applied_at,
              soldado: s.profile?.callsign ?? "",
              severidad: s.severity,
              descripcion: s.description ?? "",
              descuento: s.amount_deducted ?? "",
              confiscado: s.confiscated_items?.map((i) => i.name).join("; ") ?? "",
              vence: s.expires_at ?? "",
            }))
          )
        }
      >
        Exportar CSV ({sanctions.length})
      </Button>
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
  const [expiresAt, setExpiresAt] = useState(
    sanction.expires_at ? sanction.expires_at.slice(0, 10) : ""
  );
  const [pending, startTransition] = useTransition();

  const now = useNow();
  const confirm = useConfirm();
  const isExpired = sanction.expires_at != null && new Date(sanction.expires_at).getTime() < now;

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3 text-sm">
        <div className="flex flex-wrap gap-2">
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
          <Input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-40"
            title="Fecha de vencimiento (vacío = sin vencimiento)"
          />
        </div>
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
                const result = await updateSanction(sanction.id, {
                  severity,
                  description,
                  expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                });
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
          {sanction.expires_at ? (
            <Badge
              className={
                isExpired ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-400"
              }
              variant="secondary"
            >
              {isExpired ? `Vencida (${formatDate(sanction.expires_at)})` : `Vigente hasta ${formatDate(sanction.expires_at)}`}
            </Badge>
          ) : (
            <Badge className="bg-destructive/15 text-destructive" variant="secondary">
              Permanente
            </Badge>
          )}
        </div>
        <p className="truncate text-muted-foreground">{sanction.description ?? "—"}</p>
        {sanction.confiscated_items && sanction.confiscated_items.length > 0 && (
          <p className="text-xs text-amber-500">
            Confiscado: {sanction.confiscated_items.map((i) => i.name).join(", ")}
          </p>
        )}
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
          onClick={async () => {
            if (
              !(await confirm({
                title: "¿Borrar esta sanción?",
                description: "Si tenía descuento, también se revierte el saldo.",
                destructive: true,
              }))
            )
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
