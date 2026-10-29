import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Rank, Profile } from "@/types/database";

export type FullProfileData = {
  profile: (Profile & { rank: Rank | null });
  evaluations: Array<Record<string, unknown>>;
  rewards: Array<Record<string, unknown>>;
  sanctions: Array<Record<string, unknown>>;
  contracts: Array<{ id: string; contract_date: string; total_amount: number; risk_level: number | null }>;
  allRanks: Rank[];
  allSkills: Array<Record<string, unknown>>;
};

export async function getFullProfileData(): Promise<FullProfileData | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();

  const [
    profileRes,
    evaluationsRes,
    rewardsRes,
    sanctionsRes,
    contractsRes,
    allRanksRes,
    allSkillsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*, rank:ranks(*)").eq("id", user.id).single(),
    supabase
      .from("skill_evaluations")
      .select("*, skill:skills(*)")
      .eq("profile_id", user.id)
      .order("evaluated_at", { ascending: false }),
    supabase
      .from("rewards")
      .select("*")
      .eq("profile_id", user.id)
      .order("awarded_at", { ascending: false }),
    supabase
      .from("sanctions")
      .select("*, sanction_type:sanction_types(*)")
      .eq("profile_id", user.id)
      .order("applied_at", { ascending: false }),
    supabase
      .from("contracts")
      .select("id, contract_date, total_amount, risk_level")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false }),
    admin.from("ranks").select("*").order("sort_order", { ascending: true }),
    admin.from("skills").select("*").order("sort_order", { ascending: true }),
  ]);

  if (!profileRes.data) return null;

  return {
    profile: profileRes.data as unknown as Profile & { rank: Rank | null },
    evaluations: (evaluationsRes.data ?? []) as Array<Record<string, unknown>>,
    rewards: (rewardsRes.data ?? []) as Array<Record<string, unknown>>,
    sanctions: (sanctionsRes.data ?? []) as Array<Record<string, unknown>>,
    contracts: contractsRes.data ?? [],
    allRanks: (allRanksRes.data ?? []) as Rank[],
    allSkills: (allSkillsRes.data ?? []) as Array<Record<string, unknown>>,
  };
}
