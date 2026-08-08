import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Contract, Profile, Rank, Reward, Sanction, Transaction } from "@/types/database";

export async function getAllProfiles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, rank:ranks(*)")
    .order("approved", { ascending: true })
    .order("callsign");
  return (data ?? []) as unknown as (Profile & { rank: Rank | null })[];
}

export async function getRanks() {
  const supabase = await createClient();
  const { data } = await supabase.from("ranks").select("*").order("sort_order");
  return data ?? [];
}

export async function getContractBonusTypes() {
  const supabase = await createClient();
  const { data } = await supabase.from("contract_bonus_types").select("*").order("sort_order");
  return data ?? [];
}

export async function getContractRiskLevels() {
  const supabase = await createClient();
  const { data } = await supabase.from("contract_risk_levels").select("*").order("sort_order");
  return data ?? [];
}

export async function getSanctionTypes() {
  const supabase = await createClient();
  const { data } = await supabase.from("sanction_types").select("*").order("sort_order");
  return data ?? [];
}

export async function getPayrollSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("payroll_settings").select("*").eq("id", true).single();
  return data;
}

export async function getIntegrationSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("integration_settings").select("*").eq("id", true).single();
  return data;
}

export async function getPayrollRuns() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payroll_runs")
    .select("*")
    .order("run_at", { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getAllEventsAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").order("start_at", { ascending: false });
  return data ?? [];
}

export async function getRecentRewards() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("rewards")
    .select("*, profile:profiles(callsign)")
    .order("awarded_at", { ascending: false })
    .limit(20);
  return (data ?? []) as unknown as (Reward & { profile: { callsign: string } | null })[];
}

export async function getRecentSanctions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sanctions")
    .select("*, profile:profiles(callsign)")
    .order("applied_at", { ascending: false })
    .limit(20);
  return (data ?? []) as unknown as (Sanction & { profile: { callsign: string } | null })[];
}

export async function getRecentTransactions(limit = 40) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, profile:profiles(callsign)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as (Transaction & { profile: { callsign: string } | null })[];
}

export async function getRecentContracts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*, profile:profiles(callsign)")
    .order("created_at", { ascending: false })
    .limit(40);
  return (data ?? []) as unknown as (Contract & { profile: { callsign: string } | null })[];
}

export async function getAuditLog(limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_audit_log")
    .select("*, actor:profiles!admin_audit_log_actor_id_fkey(callsign), target:profiles!admin_audit_log_target_profile_id_fkey(callsign)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as (import("@/types/database").AdminAuditLog & {
    actor: { callsign: string } | null;
    target: { callsign: string } | null;
  })[];
}

/**
 * Todo lo necesario para el "Portal del operador" visto por mando —
 * mismo tipo de datos que ve el propio soldado en /dashboard y
 * /entrenamiento, pero para un profileId específico. Solo se usa desde
 * páginas ya protegidas por requireCommandStaff().
 */
export async function getOperatorPortalData(profileId: string) {
  const supabase = await createClient();

  const [
    { data: profile },
    { data: transactions },
    { data: contracts },
    { data: inventory },
    { data: evaluations },
    { data: quizAttempts },
  ] = await Promise.all([
    supabase.from("profiles").select("*, rank:ranks(*)").eq("id", profileId).single(),
    supabase
      .from("transactions")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("contracts")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("inventory")
      .select("*")
      .eq("profile_id", profileId)
      .order("acquired_at", { ascending: false }),
    supabase
      .from("skill_evaluations")
      .select("*, skill:skills(name)")
      .eq("profile_id", profileId)
      .order("evaluated_at", { ascending: false }),
    supabase
      .from("quiz_attempts")
      .select("*, quiz:quizzes(title)")
      .eq("profile_id", profileId)
      .order("completed_at", { ascending: false }),
  ]);

  return {
    profile: profile as unknown as (import("@/types/database").Profile & {
      rank: import("@/types/database").Rank | null;
    }) | null,
    transactions: transactions ?? [],
    contracts: contracts ?? [],
    inventory: inventory ?? [],
    evaluations: (evaluations ?? []) as unknown as (import("@/types/database").SkillEvaluation & {
      skill: { name: string } | null;
    })[],
    quizAttempts: (quizAttempts ?? []) as unknown as (import("@/types/database").QuizAttempt & {
      quiz: { title: string } | null;
    })[],
  };
}

export async function getRecentNotifications() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  return data ?? [];
}
