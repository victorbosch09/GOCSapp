import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getUpcomingEvents() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(`
      *,
      instructor:profiles!events_instructor_id_fkey(id, callsign)
    `)
    .gte("start_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("start_at", { ascending: true });
  return data ?? [];
}

export async function getEventsForMonth(year: number, month: number) {
  const supabase = await createClient();
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const { data } = await supabase
    .from("events")
    .select(`
      *,
      instructor:profiles!events_instructor_id_fkey(id, callsign)
    `)
    .gte("start_at", start)
    .lte("start_at", end)
    .order("start_at", { ascending: true });
  return data ?? [];
}

export async function getEventWithRsvps(eventId: string) {
  const supabase = await createClient();
  const [{ data: event }, { data: rsvps }, { data: signups }] = await Promise.all([
    supabase
      .from("events")
      .select(`*, instructor:profiles!events_instructor_id_fkey(id, callsign)`)
      .eq("id", eventId)
      .single(),
    supabase
      .from("event_rsvps")
      .select("*, profile:profiles(id, callsign, avatar_url)")
      .eq("event_id", eventId),
    supabase
      .from("event_rsvps")
      .select("response, profile_id")
      .eq("event_id", eventId),
  ]);
  return { event, rsvps: rsvps ?? [], signups: signups ?? [] };
}

export async function getOwnRsvpForEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("event_rsvps")
    .select("response")
    .eq("event_id", eventId)
    .eq("profile_id", user.id)
    .maybeSingle();
  return data?.response ?? null;
}
