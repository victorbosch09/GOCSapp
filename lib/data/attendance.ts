import "server-only";
import { createClient } from "@/lib/supabase/server";

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
