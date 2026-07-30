"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { rsvpToEvent } from "@/lib/actions/attendance";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event, EventAttendance, EventRsvp, RsvpResponse } from "@/types/database";

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

type RosterEntry = { id: string; callsign: string };

export function AttendanceBoard({
  events,
  rsvps,
  attendance,
  roster,
  currentProfileId,
}: {
  events: Event[];
  rsvps: EventRsvp[];
  attendance: EventAttendance[];
  roster: RosterEntry[];
  currentProfileId: string;
}) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay entrenamientos ni operaciones cargados en el calendario.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event) => (
        <EventAttendanceCard
          key={event.id}
          event={event}
          rsvps={rsvps.filter((r) => r.event_id === event.id)}
          attendance={attendance.filter((a) => a.event_id === event.id)}
          roster={roster}
          currentProfileId={currentProfileId}
        />
      ))}
    </div>
  );
}

function EventAttendanceCard({
  event,
  rsvps,
  attendance,
  roster,
  currentProfileId,
}: {
  event: Event;
  rsvps: EventRsvp[];
  attendance: EventAttendance[];
  roster: RosterEntry[];
  currentProfileId: string;
}) {
  const isUpcoming = new Date(event.start_at) >= new Date();
  const myRsvp = rsvps.find((r) => r.profile_id === currentProfileId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="font-heading text-base">{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDateTime(event.start_at)}</p>
          </div>
          <Badge variant={isUpcoming ? "secondary" : "outline"}>
            {event.event_type === "entrenamiento" ? "Entrenamiento" : "Operación"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isUpcoming && (
          <div className="flex items-center gap-3 rounded-md border border-border/60 p-3">
            <span className="text-sm text-muted-foreground">Tu respuesta en Discord:</span>
            <RsvpSelector eventId={event.id} value={myRsvp?.response} />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-normal">Operador</th>
                <th className="pb-2 font-normal">RSVP Discord</th>
                <th className="pb-2 font-normal">Asistencia real</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => {
                const rsvp = rsvps.find((x) => x.profile_id === r.id);
                const real = attendance.find((x) => x.profile_id === r.id);
                return (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="py-1.5 font-medium">{r.callsign}</td>
                    <td className="py-1.5">
                      {rsvp ? (
                        <Badge className={RSVP_BADGE[rsvp.response]} variant="secondary">
                          {RSVP_LABEL[rsvp.response]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Sin responder</span>
                      )}
                    </td>
                    <td className="py-1.5">
                      {!isUpcoming ? (
                        real ? (
                          <Badge
                            className={
                              real.attended
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-destructive/15 text-destructive"
                            }
                            variant="secondary"
                          >
                            {real.attended ? "Presente" : "Ausente"}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Sin cargar</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function RsvpSelector({ eventId, value }: { eventId: string; value?: RsvpResponse }) {
  const [pending, startTransition] = useTransition();
  const [current, setCurrent] = useState(value);

  return (
    <Select
      value={current}
      disabled={pending}
      onValueChange={(v) => {
        const response = v as RsvpResponse;
        setCurrent(response);
        startTransition(async () => {
          const result = await rsvpToEvent(eventId, response);
          if (result?.error) toast.error(result.error);
        });
      }}
    >
      <SelectTrigger size="sm" className="w-40">
        <SelectValue placeholder="Responder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="asiste">Asiste</SelectItem>
        <SelectItem value="tal_vez">Tal vez</SelectItem>
        <SelectItem value="no_asiste">No asiste</SelectItem>
      </SelectContent>
    </Select>
  );
}
