import "server-only";
import { createClient } from "@/lib/supabase/server";

const OPERATOR_RANK_NAME = "Operador lvl1";
const ASPIRANT_RANK_NAME = "Candidato";

export type BuddyProfile = { id: string; callsign: string; avatar_url: string | null };

export type BuddyTeamFull = {
  id: string;
  status: string;
  mando_points: number;
  formed_at: string;
  graduated_at: string | null;
  operator_a: BuddyProfile;
  operator_b: BuddyProfile;
  aspirant: BuddyProfile | null;
  activities: { id: string; note: string; created_at: string; author: BuddyProfile | null }[];
  ratings: { id: string; score: number; note: string | null; created_at: string; rated_by_profile: BuddyProfile | null }[];
  bonuses: { id: string; amount: number; note: string | null; created_at: string }[];
};

/** Operadores lvl1 aprobados que no están en ningún trío activo — candidatos a formar equipo. */
export async function getAvailableBuddyOperators(): Promise<BuddyProfile[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, callsign, avatar_url, rank:ranks(name)")
    .eq("approved", true);

  const { data: activeTeams } = await supabase
    .from("buddy_teams")
    .select("operator_a_id, operator_b_id")
    .not("status", "in", "(graduado,disuelto)");

  const busy = new Set<string>();
  for (const t of activeTeams ?? []) {
    busy.add(t.operator_a_id);
    busy.add(t.operator_b_id);
  }

  return (profiles ?? [])
    .filter((p) => (p as unknown as { rank: { name: string } | null }).rank?.name === OPERATOR_RANK_NAME)
    .filter((p) => !busy.has(p.id))
    .map((p) => ({ id: p.id, callsign: p.callsign, avatar_url: p.avatar_url }));
}

/** Candidatos aprobados que no son aspirantes de ningún trío activo — disponibles para draftear. */
export async function getAvailableAspirants(): Promise<BuddyProfile[]> {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, callsign, avatar_url, rank:ranks(name)")
    .eq("approved", true);

  const { data: activeTeams } = await supabase
    .from("buddy_teams")
    .select("aspirant_id")
    .not("status", "in", "(graduado,disuelto)")
    .not("aspirant_id", "is", null);

  const taken = new Set((activeTeams ?? []).map((t) => t.aspirant_id));

  return (profiles ?? [])
    .filter((p) => (p as unknown as { rank: { name: string } | null }).rank?.name === ASPIRANT_RANK_NAME)
    .filter((p) => !taken.has(p.id))
    .map((p) => ({ id: p.id, callsign: p.callsign, avatar_url: p.avatar_url }));
}

export async function getAllBuddyTeams(): Promise<BuddyTeamFull[]> {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("buddy_teams")
    .select(
      `id, status, mando_points, formed_at, graduated_at,
       operator_a:profiles!buddy_teams_operator_a_id_fkey(id, callsign, avatar_url),
       operator_b:profiles!buddy_teams_operator_b_id_fkey(id, callsign, avatar_url),
       aspirant:profiles!buddy_teams_aspirant_id_fkey(id, callsign, avatar_url)`
    )
    .order("formed_at", { ascending: false });

  if (!teams || teams.length === 0) return [];

  const teamIds = teams.map((t) => t.id);

  const [{ data: activities }, { data: ratings }, { data: bonuses }] = await Promise.all([
    supabase
      .from("buddy_activities")
      .select("id, team_id, note, created_at, author:profiles(id, callsign, avatar_url)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("buddy_ratings")
      .select("id, team_id, score, note, created_at, rated_by_profile:profiles!buddy_ratings_rated_by_fkey(id, callsign, avatar_url)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("buddy_bonuses")
      .select("id, team_id, amount, note, created_at")
      .in("team_id", teamIds),
  ]);

  return (teams as unknown as (BuddyTeamFull & { id: string })[]).map((t) => ({
    ...t,
    activities: (activities ?? []).filter((a) => a.team_id === t.id) as unknown as BuddyTeamFull["activities"],
    ratings: (ratings ?? []).filter((r) => r.team_id === t.id) as unknown as BuddyTeamFull["ratings"],
    bonuses: (bonuses ?? []).filter((b) => b.team_id === t.id),
  }));
}

export async function getBuddyStats() {
  const teams = await getAllBuddyTeams();
  return {
    activeTeams: teams.filter((t) => t.status !== "graduado" && t.status !== "disuelto").length,
    inTraining: teams.filter((t) => t.status === "en_entrenamiento").length,
    readyToPromote: teams.filter((t) => t.status === "listo_para_ascender").length,
    graduated: teams.filter((t) => t.status === "graduado").length,
  };
}
