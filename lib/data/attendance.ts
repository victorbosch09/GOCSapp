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
