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

export async function getSkillCompletionStats() {
  const supabase = await createClient();
  const { data } = await supabase.from("skill_completion_stats").select("*").order("sort_order");
  return data ?? [];
}

export async function getDisciplineOverview() {
  const supabase = await createClient();
  const { data } = await supabase.from("discipline_overview").select("*").single();
  return data;
}

export async function getPinnedAnnouncements() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("pinned", true)
    .eq("target_type", "all")
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

export async function getOperatorRankings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("operator_rankings")
    .select("*")
    .order("contratos_30d", { ascending: false })
    .order("asistencias_30d", { ascending: false })
    .limit(5);
  return data ?? [];
}
