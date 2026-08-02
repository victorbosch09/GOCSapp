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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Explicit profile_id filter: RLS also grants command staff/instructors
  // broad read access to this table for admin views, so an unfiltered
  // query here would return every soldier's evaluations, not just the
  // caller's own.
  const { data } = await supabase
    .from("skill_evaluations")
    .select("*, skill:skills(name, category)")
    .eq("profile_id", user.id)
    .order("evaluated_at", { ascending: false });
  return (data ?? []) as unknown as (SkillEvaluation & {
    skill: { name: string; category: string | null } | null;
  })[];
}

export type OwnTrainingStats = {
  quizzesAttempted: number;
  quizzesPassed: number;
  avgScorePct: number;
  totalQuizCredits: number;
  modulesAprobados: number;
  modulesEnProgreso: number;
  modulesNoAprobados: number;
};

/**
 * Aggregates the caller's own training activity for the "Mis estadísticas"
 * card. Every query here is explicitly filtered by profile_id — see the
 * note on getOwnEvaluations above.
 */
export async function getOwnTrainingStats(): Promise<OwnTrainingStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: OwnTrainingStats = {
    quizzesAttempted: 0,
    quizzesPassed: 0,
    avgScorePct: 0,
    totalQuizCredits: 0,
    modulesAprobados: 0,
    modulesEnProgreso: 0,
    modulesNoAprobados: 0,
  };
  if (!user) return empty;

  const [{ data: attempts }, { data: evaluations }, { data: bonusTxns }] = await Promise.all([
    supabase.from("quiz_attempts").select("quiz_id, score, total").eq("profile_id", user.id),
    supabase.from("skill_evaluations").select("result").eq("profile_id", user.id),
    supabase
      .from("transactions")
      .select("amount")
      .eq("profile_id", user.id)
      .eq("type", "Bono")
      .ilike("detail", "Quiz aprobado:%"),
  ]);

  const uniqueQuizzes = new Set((attempts ?? []).map((a) => a.quiz_id));
  const bestPassPerQuiz = new Set(
    (attempts ?? []).filter((a) => a.total > 0 && a.score / a.total >= 0.7).map((a) => a.quiz_id)
  );
  const avgScorePct =
    attempts && attempts.length > 0
      ? Math.round(
          (100 * attempts.reduce((sum, a) => sum + (a.total > 0 ? a.score / a.total : 0), 0)) /
            attempts.length
        )
      : 0;

  return {
    quizzesAttempted: uniqueQuizzes.size,
    quizzesPassed: bestPassPerQuiz.size,
    avgScorePct,
    totalQuizCredits: (bonusTxns ?? []).reduce((sum, t) => sum + Number(t.amount), 0),
    modulesAprobados: (evaluations ?? []).filter((e) => e.result === "aprobado").length,
    modulesEnProgreso: (evaluations ?? []).filter((e) => e.result === "en_progreso").length,
    modulesNoAprobados: (evaluations ?? []).filter((e) => e.result === "no_aprobado").length,
  };
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
