"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { markAttendance } from "@/lib/actions/attendance";
import { formatDateTime } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event, EventAttendance, EventRsvp, RsvpResponse } from "@/types/database";

const RSVP_LABEL: Record<RsvpResponse, string> = {
  asiste: "Asiste",
  tal_vez: "Tal vez",
  no_asiste: "No asiste",
};

type RosterEntry = { id: string; callsign: string };

export function AttendanceMarker({
  events,
  rsvps,
  attendance,
  roster,
}: {
  events: Event[];
  rsvps: EventRsvp[];
  attendance: EventAttendance[];
  roster: RosterEntry[];
}) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [localAttendance, setLocalAttendance] = useState(attendance);

  const selectedEvent = events.find((e) => e.id === eventId);
  const eventRsvps = rsvps.filter((r) => r.event_id === eventId);
  const eventAttendance = localAttendance.filter((a) => a.event_id === eventId);

  const attendedCount = eventAttendance.filter((a) => a.attended).length;

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay entrenamientos ni operaciones cargados.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Select value={eventId} onValueChange={setEventId}>
        <SelectTrigger className="w-full sm:w-96">
          <SelectValue placeholder="Elegí un evento" />
        </SelectTrigger>
        <SelectContent>
          {events.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.title} — {formatDateTime(e.start_at)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedEvent && (
        <>
          <p className="text-sm text-muted-foreground">
            {attendedCount}/{roster.length} marcados presentes. La asistencia real de este evento se
            usa para el sueldo semanal si cayó dentro de los últimos 7 días.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2 font-normal">Operador</th>
                  <th className="pb-2 font-normal">RSVP Discord</th>
                  <th className="pb-2 font-normal">Presente</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <AttendanceRow
                    key={r.id}
                    profileId={r.id}
                    callsign={r.callsign}
                    eventId={eventId}
                    rsvp={eventRsvps.find((x) => x.profile_id === r.id)}
                    attended={eventAttendance.find((x) => x.profile_id === r.id)?.attended ?? false}
                    onChanged={(attended) =>
                      setLocalAttendance((prev) => {
                        const next = prev.filter(
                          (a) => !(a.event_id === eventId && a.profile_id === r.id)
                        );
                        next.push({
                          id: `local-${eventId}-${r.id}`,
                          event_id: eventId,
                          profile_id: r.id,
                          attended,
                          marked_by: null,
                          marked_at: new Date().toISOString(),
                        });
                        return next;
                      })
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function AttendanceRow({
  profileId,
  callsign,
  eventId,
  rsvp,
  attended,
  onChanged,
}: {
  profileId: string;
  callsign: string;
  eventId: string;
  rsvp?: EventRsvp;
  attended: boolean;
  onChanged: (attended: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const rsvpLabel = useMemo(() => (rsvp ? RSVP_LABEL[rsvp.response] : "Sin responder"), [rsvp]);

  return (
    <tr className="border-t border-border/40">
      <td className="py-1.5 font-medium">{callsign}</td>
      <td className="py-1.5">
        <Badge variant="outline">{rsvpLabel}</Badge>
      </td>
      <td className="py-1.5">
        <Switch
          checked={attended}
          disabled={pending}
          onCheckedChange={(checked) => {
            onChanged(checked);
            startTransition(async () => {
              const result = await markAttendance(eventId, profileId, checked);
              if (result?.error) toast.error(result.error);
            });
          }}
        />
      </td>
    </tr>
  );
}
