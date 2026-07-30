import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getTeamOverview() {
  const supabase = await createClient();
  const { data } = await supabase.from("team_overview").select("*").single();
  return data;
}

export async function getRoster() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("roster_public")
    .select("*")
    .order("rank_sort_order", { ascending: false })
    .order("callsign");
  return data ?? [];
}
