"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RsvpButtons } from "@/components/calendar/rsvp-buttons";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { Event, EventType, RsvpResponse } from "@/types/database";

const TYPE_COLOR: Record<EventType, string> = {
  entrenamiento: "bg-blue-500",
  operacion: "bg-primary",
  pago: "bg-emerald-500",
  otro: "bg-muted-foreground",
};

const TYPE_BADGE: Record<EventType, string> = {
  entrenamiento: "bg-blue-500/15 text-blue-400",
  operacion: "bg-primary/15 text-foreground",
  pago: "bg-emerald-500/15 text-emerald-400",
  otro: "bg-muted text-muted-foreground",
};

const TYPE_LABEL: Record<EventType, string> = {
  entrenamiento: "Entrenamiento",
  operacion: "Operación",
  pago: "Pago",
  otro: "Otro",
};

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type EventWithInstructor = Event & {
  instructor?: { id: string; callsign: string } | null;
};

type RsvpMap = Record<string, RsvpResponse | null>;

export function CalendarGrid({
  initialEvents,
  currentUserId,
  isCommandStaff,
}: {
  initialEvents: EventWithInstructor[];
  currentUserId: string;
  isCommandStaff: boolean;
}) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<EventWithInstructor[]>(initialEvents);
  const [selected, setSelected] = useState<EventWithInstructor | null>(null);
  const [rsvpMap, setRsvpMap] = useState<RsvpMap>({});
  const [mode, setMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("calendar-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        // Refetch on any event change
        supabase
          .from("events")
          .select("*, instructor:profiles!events_instructor_id_fkey(id, callsign)")
          .order("start_at", { ascending: true })
          .then(({ data }) => { if (data) setEvents(data as unknown as EventWithInstructor[]); });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Load own RSVPs for visible events
  useEffect(() => {
    const supabase = createClient();
    const ids = events.map((e) => e.id);
    if (ids.length === 0) return;
    supabase
      .from("event_rsvps")
      .select("event_id, response")
      .eq("profile_id", currentUserId)
      .in("event_id", ids)
      .then(({ data }) => {
        const map: RsvpMap = {};
        (data ?? []).forEach((r) => { map[r.event_id] = r.response as RsvpResponse; });
        setRsvpMap(map);
      });
  }, [events, currentUserId]);

  function handleRsvpUpdate(eventId: string, response: RsvpResponse) {
    setRsvpMap((prev) => ({ ...prev, [eventId]: response }));
  }

  // Build grid days for the current month
  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  // Monday-first offset (getDay: 0=Sun → offset 6, 1=Mon → offset 0, etc.)
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
    ...Array(totalCells - startOffset - lastDay.getDate()).fill(null),
  ];

  function eventsForDay(day: number) {
    return events.filter((e) => {
      const d = new Date(e.start_at);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
  }

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  const monthEvents = events.filter((e) => {
    const d = new Date(e.start_at);
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-heading min-w-[160px] text-center text-lg">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setMode("grid")}
            title="Vista mensual"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant={mode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => setMode("list")}
            title="Vista lista"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.keys(TYPE_LABEL) as EventType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={cn("h-2 w-2 rounded-full", TYPE_COLOR[t])} />
            {TYPE_LABEL[t]}
          </span>
        ))}
      </div>

      {mode === "grid" ? (
        /* Monthly grid */
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <div className="min-w-[560px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30">
              {DAY_NAMES.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                const dayEvents = day ? eventsForDay(day) : [];
                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[110px] border-b border-r border-border/40 p-1.5",
                      idx % 7 === 6 && "border-r-0",
                      idx >= cells.length - 7 && "border-b-0",
                      !day && "bg-muted/10"
                    )}
                  >
                    {day && (
                      <>
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                            isToday(day)
                              ? "bg-primary font-bold text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {day}
                        </span>
                        <div className="mt-1 flex flex-col gap-0.5">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <button
                              key={ev.id}
                              onClick={() => setSelected(ev)}
                              className={cn(
                                "w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium transition-opacity hover:opacity-80",
                                TYPE_COLOR[ev.event_type],
                                "text-white"
                              )}
                            >
                              {ev.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <span className="px-1 text-[10px] text-muted-foreground">
                              +{dayEvents.length - 3} más
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List view */
        <div className="flex flex-col gap-3">
          {monthEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay eventos este mes.</p>
          ) : (
            monthEvents.map((ev) => {
              const isPast = new Date(ev.start_at) < new Date();
              return (
                <button
                  key={ev.id}
                  onClick={() => setSelected(ev)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/30",
                    isPast && "opacity-60"
                  )}
                >
                  <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", TYPE_COLOR[ev.event_type])} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(ev.start_at)}</p>
                    {ev.instructor && (
                      <p className="text-xs text-muted-foreground">Instructor: {ev.instructor.callsign}</p>
                    )}
                  </div>
                  <Badge className={TYPE_BADGE[ev.event_type]} variant="secondary">
                    {TYPE_LABEL[ev.event_type]}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Event detail modal */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading pr-6">{selected.title}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-1">
              <div className="flex flex-wrap gap-2">
                <Badge className={TYPE_BADGE[selected.event_type]} variant="secondary">
                  {TYPE_LABEL[selected.event_type]}
                </Badge>
                {new Date(selected.start_at) < new Date() && (
                  <Badge variant="outline">Pasado</Badge>
                )}
              </div>

              <div className="flex flex-col gap-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Inicio: </span>
                  {formatDateTime(selected.start_at)}
                </p>
                {selected.end_at && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Fin: </span>
                    {formatDateTime(selected.end_at)}
                  </p>
                )}
                {selected.instructor && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Instructor: </span>
                    {selected.instructor.callsign}
                  </p>
                )}
                {selected.max_participants && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Cupo: </span>
                    {selected.max_participants} operadores
                  </p>
                )}
              </div>

              {selected.description && (
                <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
                  {selected.description}
                </p>
              )}

              {new Date(selected.start_at) > new Date() && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tu respuesta</p>
                  <RsvpButtons
                    eventId={selected.id}
                    current={rsvpMap[selected.id] ?? null}
                  />
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
