"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";
import { downloadIcsEvent } from "@/lib/ics";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Event, EventType } from "@/types/database";

const TYPE_LABEL: Record<EventType, string> = {
  entrenamiento: "Entrenamiento",
  operacion: "Operación",
  pago: "Pago",
  otro: "Otro",
};

const TYPE_BADGE: Record<EventType, string> = {
  entrenamiento: "bg-blue-500/15 text-blue-400",
  operacion: "bg-primary/15 text-foreground",
  pago: "bg-emerald-500/15 text-emerald-400",
  otro: "bg-muted text-muted-foreground",
};

export function EventList({ initial }: { initial: Event[] }) {
  const [events, setEvents] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("events-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload) => {
        setEvents((prev) => {
          let next = [...prev];
          if (payload.eventType === "DELETE") {
            next = next.filter((e) => e.id !== (payload.old as { id: string }).id);
          } else {
            const row = payload.new as Event;
            const idx = next.findIndex((e) => e.id === row.id);
            if (idx >= 0) next[idx] = row;
            else next.push(row);
          }
          return next.sort(
            (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
          );
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay eventos próximos programados.</p>;
  }

  const now = Date.now();

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => {
        const isPast = new Date(event.start_at).getTime() < now;
        return (
          <Card key={event.id} className={isPast ? "opacity-60" : undefined}>
            <CardContent className="flex items-start justify-between gap-4 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{event.title}</p>
                  <Badge className={TYPE_BADGE[event.event_type]} variant="secondary">
                    {TYPE_LABEL[event.event_type]}
                  </Badge>
                  {isPast && <Badge variant="outline">Ya pasó</Badge>}
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 text-right text-sm text-muted-foreground">
                <p>{formatDateTime(event.start_at)}</p>
                {event.end_at && <p>hasta {formatDateTime(event.end_at)}</p>}
                {!isPast && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => downloadIcsEvent(event)}
                  >
                    + Calendario
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
