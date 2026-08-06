"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { markAttendance, setDiscordRsvp } from "@/lib/actions/attendance";
import { formatDateTime } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event, EventAttendance, EventRsvp, RsvpResponse } from "@/types/database";

const RSVP_LABEL: Record<string, string> = {
  sin_marcar: "Sin marcar",
  asiste: "Asiste",
  tal_vez: "Tal vez",
  no_asiste: "No asiste",
};

type RosterEntry = { id: string; callsign: string };
type Key = string;

function key(eventId: string, profileId: string): Key {
  return `${eventId}:${profileId}`;
}

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
  // Cada evento es una sección independiente y siempre visible — nunca
  // depende de una selección compartida que se pueda perder de vista
  // cuando hay varios eventos activos a la vez.
  const [rsvpMap, setRsvpMap] = useState<Map<Key, RsvpResponse>>(
    () => new Map(rsvps.map((r) => [key(r.event_id, r.profile_id), r.response]))
  );
  const [attendanceMap, setAttendanceMap] = useState<Map<Key, boolean>>(
    () => new Map(attendance.map((a) => [key(a.event_id, a.profile_id), a.attended]))
  );

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay entrenamientos ni operaciones cargados.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event, i) => {
        const attendedCount = roster.filter((r) => attendanceMap.get(key(event.id, r.id))).length;
        return (
          <details
            key={event.id}
            open={i === 0}
            className="rounded-md border border-border/60 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.start_at)}</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {attendedCount}/{roster.length} presentes
              </span>
            </summary>
            <div className="overflow-x-auto border-t border-border/60 p-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 font-normal">Operador</th>
                    <th className="pb-2 font-normal">Marcó en Discord</th>
                    <th className="pb-2 font-normal">Asistió realmente</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((r) => (
                    <AttendanceRow
                      key={r.id}
                      profileId={r.id}
                      callsign={r.callsign}
                      eventId={event.id}
                      rsvp={rsvpMap.get(key(event.id, r.id))}
                      attended={attendanceMap.get(key(event.id, r.id)) ?? false}
                      onRsvpChanged={(response) =>
                        setRsvpMap((prev) => {
                          const next = new Map(prev);
                          if (response === null) next.delete(key(event.id, r.id));
                          else next.set(key(event.id, r.id), response);
                          return next;
                        })
                      }
                      onAttendedChanged={(attended) =>
                        setAttendanceMap((prev) => new Map(prev).set(key(event.id, r.id), attended))
                      }
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </div>
  );
}

function AttendanceRow({
  profileId,
  callsign,
  eventId,
  rsvp,
  attended,
  onRsvpChanged,
  onAttendedChanged,
}: {
  profileId: string;
  callsign: string;
  eventId: string;
  rsvp?: RsvpResponse;
  attended: boolean;
  onRsvpChanged: (response: RsvpResponse | null) => void;
  onAttendedChanged: (attended: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <tr className="border-t border-border/40">
      <td className="py-1.5 font-medium">{callsign}</td>
      <td className="py-1.5">
        <Select
          value={rsvp ?? "sin_marcar"}
          disabled={pending}
          onValueChange={(v) => {
            const response = v === "sin_marcar" ? null : (v as RsvpResponse);
            onRsvpChanged(response);
            startTransition(async () => {
              const result = await setDiscordRsvp(eventId, profileId, response);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RSVP_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5">
        <Switch
          checked={attended}
          disabled={pending}
          onCheckedChange={(checked) => {
            onAttendedChanged(checked);
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
