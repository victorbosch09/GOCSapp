import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Rank } from "@/types/database";

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
  return data ?? [];
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
