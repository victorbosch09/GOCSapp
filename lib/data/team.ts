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

export type SquadRanking = {
  squad: string;
  memberCount: number;
  contratos30d: number;
  asistencias30d: number;
  eventosOficiales30d: number;
};

/** Agrega operator_rankings por escuadra — mismo dato ya público, solo agrupado distinto. */
export async function getSquadRankings(): Promise<SquadRanking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("operator_rankings")
    .select("squad, contratos_30d, asistencias_30d, eventos_oficiales_30d");

  if (!data) return [];

  const bySquad = new Map<string, SquadRanking>();
  for (const row of data) {
    const key = row.squad ?? "Sin escuadra";
    if (!bySquad.has(key)) {
      bySquad.set(key, { squad: key, memberCount: 0, contratos30d: 0, asistencias30d: 0, eventosOficiales30d: row.eventos_oficiales_30d ?? 0 });
    }
    const entry = bySquad.get(key)!;
    entry.memberCount += 1;
    entry.contratos30d += row.contratos_30d ?? 0;
    entry.asistencias30d += row.asistencias_30d ?? 0;
  }

  return Array.from(bySquad.values())
    .filter((s) => s.squad !== "Sin escuadra")
    .sort((a, b) => b.contratos30d + b.asistencias30d - (a.contratos30d + a.asistencias30d));
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
