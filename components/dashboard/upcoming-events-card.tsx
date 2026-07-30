"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { rsvpToEvent } from "@/lib/actions/attendance";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event, RsvpResponse } from "@/types/database";

type EventWithRsvp = Event & { myResponse: RsvpResponse | null };

export function UpcomingEventsCard({ events }: { events: EventWithRsvp[] }) {
  if (events.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">Próximas actividades</CardTitle>
        <CardDescription>Respondé tu asistencia rápido desde acá.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </CardContent>
    </Card>
  );
}

function EventRow({ event }: { event: EventWithRsvp }) {
  const [response, setResponse] = useState(event.myResponse ?? undefined);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 p-3 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{event.title}</span>
          <Badge variant="secondary">
            {event.event_type === "entrenamiento" ? "Entrenamiento" : "Operación"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatDateTime(event.start_at)}</p>
      </div>
      <Select
        value={response}
        disabled={pending}
        onValueChange={(v) => {
          const r = v as RsvpResponse;
          setResponse(r);
          startTransition(async () => {
            const result = await rsvpToEvent(event.id, r);
            if (result?.error) toast.error(result.error);
          });
        }}
      >
        <SelectTrigger size="sm" className="w-36">
          <SelectValue placeholder="Responder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="asiste">Asiste</SelectItem>
          <SelectItem value="tal_vez">Tal vez</SelectItem>
          <SelectItem value="no_asiste">No asiste</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
