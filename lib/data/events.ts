import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getUpcomingEvents() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .gte("start_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("start_at", { ascending: true });
  return data ?? [];
}
