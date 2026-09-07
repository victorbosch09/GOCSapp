import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getUpcomingEventsForDashboard(limit = 3) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("event_type", ["entrenamiento", "operacion"])
    .gte("start_at", new Date().toISOString())
    .order("start_at", { ascending: true })
    .limit(limit);

  if (!events || events.length === 0 || !user) return [];

  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("profile_id", user.id)
    .in(
      "event_id",
      events.map((e) => e.id)
    );

  return events.map((e) => ({
    ...e,
    myResponse: rsvps?.find((r) => r.event_id === e.id)?.response ?? null,
  }));
}

/**
 * Racha de asistencia real, contando hacia atrás desde el evento pasado más
 * reciente que ya tiene asistencia cargada por el mando. Eventos sin marcar
 * todavía se saltean (no rompen ni suman la racha) en vez de tratarse como
 * ausencia — no es culpa del soldado que el mando no lo haya cargado.
 */
export async function getOwnAttendanceStreak() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: events } = await supabase
    .from("events")
    .select("id")
    .in("event_type", ["entrenamiento", "operacion"])
    .lt("start_at", new Date().toISOString())
    .order("start_at", { ascending: false })
    .limit(30);

  if (!events || events.length === 0) return 0;

  const { data: attendance } = await supabase
    .from("event_attendance")
    .select("event_id, attended")
    .eq("profile_id", user.id)
    .in(
      "event_id",
      events.map((e) => e.id)
    );

  const byEvent = new Map((attendance ?? []).map((a) => [a.event_id, a.attended]));

  let streak = 0;
  for (const event of events) {
    const attended = byEvent.get(event.id);
    if (attended === undefined) continue;
    if (attended) streak++;
    else break;
  }
  return streak;
}

export type AttendanceHistoryEntry = {
  eventId: string;
  title: string;
  startAt: string;
  status: "asistio" | "falto" | "sin_marcar";
};

/** Últimos N eventos oficiales pasados y si el propio operador asistió, para el heatmap del dashboard. */
export async function getOwnAttendanceHistory(limit = 60): Promise<AttendanceHistoryEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_at")
    .in("event_type", ["entrenamiento", "operacion"])
    .lt("start_at", new Date().toISOString())
    .order("start_at", { ascending: false })
    .limit(limit);

  if (!events || events.length === 0) return [];

  const { data: attendance } = await supabase
    .from("event_attendance")
    .select("event_id, attended")
    .eq("profile_id", user.id)
    .in(
      "event_id",
      events.map((e) => e.id)
    );

  const byEvent = new Map((attendance ?? []).map((a) => [a.event_id, a.attended]));

  return events
    .map((e) => {
      const attended = byEvent.get(e.id);
      const status: AttendanceHistoryEntry["status"] =
        attended === undefined ? "sin_marcar" : attended ? "asistio" : "falto";
      return { eventId: e.id, title: e.title, startAt: e.start_at, status };
    })
    .reverse();
}

export async function getAttendanceBoard() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("event_type", ["entrenamiento", "operacion"])
    .order("start_at", { ascending: false })
    .limit(20);

  const eventIds = (events ?? []).map((e) => e.id);

  const [{ data: rsvps }, { data: attendance }, { data: roster }] = await Promise.all([
    eventIds.length > 0
      ? supabase.from("event_rsvps").select("*").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    eventIds.length > 0
      ? supabase.from("event_attendance").select("*").in("event_id", eventIds)
      : Promise.resolve({ data: [] }),
    supabase.from("roster_public").select("id, callsign").order("callsign"),
  ]);

  return {
    events: events ?? [],
    rsvps: rsvps ?? [],
    attendance: attendance ?? [],
    roster: roster ?? [],
  };
}
