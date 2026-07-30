import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Quiz, QuizQuestion } from "@/types/database";

export async function getQuizzes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quizzes")
    .select("*, skill:skills(name), questions:quiz_questions(id)")
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as (Quiz & {
    skill: { name: string } | null;
    questions: { id: string }[];
  })[];
}

export async function getQuizWithQuestions(quizId: string) {
  const supabase = await createClient();
  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", quizId).single();
  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", quizId)
    .order("sort_order");
  return { quiz: quiz as Quiz | null, questions: (questions ?? []) as QuizQuestion[] };
}

export async function getOwnQuizAttempts() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quiz_attempts")
    .select("*, quiz:quizzes(title)")
    .order("completed_at", { ascending: false });
  return (data ?? []) as unknown as (import("@/types/database").QuizAttempt & {
    quiz: { title: string } | null;
  })[];
}
