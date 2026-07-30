import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SkillEvaluation } from "@/types/database";

export async function getSkills() {
  const supabase = await createClient();
  const { data } = await supabase.from("skills").select("*").order("sort_order");
  return data ?? [];
}

export async function getOwnEvaluations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skill_evaluations")
    .select("*, skill:skills(name, category)")
    .order("evaluated_at", { ascending: false });
  return (data ?? []) as unknown as (SkillEvaluation & {
    skill: { name: string; category: string | null } | null;
  })[];
}

export async function getTrainingMaterials() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("training_materials")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllEvaluations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("skill_evaluations")
    .select("*, skill:skills(name), profile:profiles(callsign)")
    .order("evaluated_at", { ascending: false })
    .limit(100);
  return (data ?? []) as unknown as (SkillEvaluation & {
    skill: { name: string } | null;
    profile: { callsign: string } | null;
  })[];
}
