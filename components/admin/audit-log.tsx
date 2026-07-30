import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminAuditLog } from "@/types/database";

type AuditRow = AdminAuditLog & {
  actor: { callsign: string } | null;
  target: { callsign: string } | null;
};

export function AuditLog({ entries }: { entries: AuditRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Auditoría</CardTitle>
        <CardDescription>Acciones sensibles del mando (últimas {entries.length}).</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad registrada todavía.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="rounded-md border border-border/60 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{e.action}</Badge>
                <span className="font-medium">{e.actor?.callsign ?? "—"}</span>
                {e.target?.callsign && (
                  <span className="text-muted-foreground">→ {e.target.callsign}</span>
                )}
              </div>
              {e.detail && <p className="mt-1 text-muted-foreground">{e.detail}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(e.created_at)}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
