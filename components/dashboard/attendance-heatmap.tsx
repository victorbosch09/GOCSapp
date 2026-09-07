import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AttendanceHistoryEntry } from "@/lib/data/attendance";

const STATUS_COLOR: Record<AttendanceHistoryEntry["status"], string> = {
  asistio: "bg-emerald-500",
  falto: "bg-destructive",
  sin_marcar: "bg-muted",
};

const STATUS_LABEL: Record<AttendanceHistoryEntry["status"], string> = {
  asistio: "Asistió",
  falto: "Faltó",
  sin_marcar: "Sin marcar",
};

export function AttendanceHeatmap({ history }: { history: AttendanceHistoryEntry[] }) {
  if (history.length === 0) {
    return null;
  }

  const attended = history.filter((h) => h.status === "asistio").length;
  const marked = history.filter((h) => h.status !== "sin_marcar").length;
  const pct = marked > 0 ? Math.round((attended / marked) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Mi historial de asistencia</CardTitle>
        <CardDescription>
          Últimos {history.length} eventos oficiales — {pct}% de asistencia sobre lo marcado.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {history.map((h) => (
            <div
              key={h.eventId}
              title={`${h.title} — ${formatDate(h.startAt)} — ${STATUS_LABEL[h.status]}`}
              className={`size-4 shrink-0 rounded-sm ${STATUS_COLOR[h.status]}`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-emerald-500" /> Asistió
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-destructive" /> Faltó
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted" /> Sin marcar
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
