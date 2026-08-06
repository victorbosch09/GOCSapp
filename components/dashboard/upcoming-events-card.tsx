import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event, RsvpResponse } from "@/types/database";

type EventWithRsvp = Event & { myResponse: RsvpResponse | null };

const RSVP_LABEL: Record<RsvpResponse, string> = {
  asiste: "Asiste",
  tal_vez: "Tal vez",
  no_asiste: "No asiste",
};

const RSVP_BADGE: Record<RsvpResponse, string> = {
  asiste: "bg-emerald-500/15 text-emerald-400",
  tal_vez: "bg-amber-500/15 text-amber-400",
  no_asiste: "bg-destructive/15 text-destructive",
};

export function UpcomingEventsCard({ events }: { events: EventWithRsvp[] }) {
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">Próximas actividades</CardTitle>
        <CardDescription>
          Tu respuesta de Discord la carga el mando — avisá tu asistencia por ahí.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {events.map((e) => (
          <div
            key={e.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 p-3 text-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{e.title}</span>
                <Badge variant="secondary">
                  {e.event_type === "entrenamiento" ? "Entrenamiento" : "Operación"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{formatDateTime(e.start_at)}</p>
            </div>
            {e.myResponse ? (
              <Badge className={RSVP_BADGE[e.myResponse]} variant="secondary">
                {RSVP_LABEL[e.myResponse]}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Sin marcar todavía</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
