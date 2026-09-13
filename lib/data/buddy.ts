import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ASPIRANT_RANK_NAME = "Candidato";
const MIN_MENTOR_RANK_NAME = "Operador lvl1";

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

/**
 * Sort_order of "Operador lvl1" — anyone at or above this rank can mentor
 * in the Buddy System (ON-1, ON-2, Especialista, Líder, etc, not just ON-1).
 * Only "Candidato" (sort_order below this) is excluded from mentoring.
 */
export async function getMentorRankThreshold(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.from("ranks").select("sort_order").eq("name", MIN_MENTOR_RANK_NAME).single();
  return data?.sort_order ?? 0;
}

export function isMentorEligible(rankSortOrder: number | null | undefined, threshold: number): boolean {
  return rankSortOrder != null && rankSortOrder >= threshold;
}

// Estas lecturas usan el admin client a propósito: profiles.RLS solo deja
// ver la fila propia a quien no es mando ("profiles_select_own"), así que
// un Operador lvl1 común nunca podía ver a otros candidatos a compañero ni
// a otros tríos (los embeds de profiles dentro de buddy_teams también caen
// bajo esa misma RLS). Las tablas buddy_* ya tienen su propia policy que
// deja ver todo a cualquier aprobado, así que esto no expone nada de más —
// solo evita que la RLS de profiles bloquee un dato que ya debía ser visible.

/** Aprobados de rango Operador lvl1 o superior, sin trío activo — candidatos a formar equipo. */
export async function getAvailableBuddyOperators(): Promise<BuddyProfile[]> {
  const admin = createAdminClient();
  const threshold = await getMentorRankThreshold();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, callsign, avatar_url, rank:ranks(sort_order)")
    .eq("approved", true);

  const { data: activeTeams } = await admin
    .from("buddy_teams")
    .select("operator_a_id, operator_b_id")
    .not("status", "in", "(graduado,disuelto)");

  const busy = new Set<string>();
  for (const t of activeTeams ?? []) {
    busy.add(t.operator_a_id);
    busy.add(t.operator_b_id);
  }

  return (profiles ?? [])
    .filter((p) => isMentorEligible((p as unknown as { rank: { sort_order: number } | null }).rank?.sort_order, threshold))
    .filter((p) => !busy.has(p.id))
    .map((p) => ({ id: p.id, callsign: p.callsign, avatar_url: p.avatar_url }));
}

/** Candidatos aprobados que no son aspirantes de ningún trío activo — disponibles para draftear. */
export async function getAvailableAspirants(): Promise<BuddyProfile[]> {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, callsign, avatar_url, rank:ranks(name)")
    .eq("approved", true);

  const { data: activeTeams } = await admin
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
  const admin = createAdminClient();

  const { data: teams, error } = await admin
    .from("buddy_teams")
    .select(
      `id, status, mando_points, formed_at, graduated_at,
       operator_a:profiles!buddy_teams_operator_a_id_fkey(id, callsign, avatar_url),
       operator_b:profiles!buddy_teams_operator_b_id_fkey(id, callsign, avatar_url),
       aspirant:profiles!buddy_teams_aspirant_id_fkey(id, callsign, avatar_url)`
    )
    .order("formed_at", { ascending: false });
  if (error) console.error("[getAllBuddyTeams]", error.message);

  if (!teams || teams.length === 0) return [];

  const teamIds = teams.map((t) => t.id);

  const [{ data: activities }, { data: ratings }, { data: bonuses }] = await Promise.all([
    admin
      .from("buddy_activities")
      .select("id, team_id, note, created_at, author:profiles(id, callsign, avatar_url)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false }),
    admin
      .from("buddy_ratings")
      .select("id, team_id, score, note, created_at, rated_by_profile:profiles!buddy_ratings_rated_by_fkey(id, callsign, avatar_url)")
      .in("team_id", teamIds)
      .order("created_at", { ascending: false }),
    admin
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
