"use server";

import { revalidatePath } from "next/cache";
import { requireInstructorOrStaff } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { QuizDifficulty } from "@/types/database";

type ActionResult = { error?: string; success?: true };

export async function createQuiz(input: {
  title: string;
  description: string;
  skillId: string | null;
  difficulty: QuizDifficulty;
  questions: { question: string; options: string[]; correctIndex: number }[];
}): Promise<ActionResult> {
  const staff = await requireInstructorOrStaff();
  if (!input.title.trim()) return { error: "El título es obligatorio." };
  if (input.questions.length === 0) return { error: "Agregá al menos una pregunta." };
  for (const q of input.questions) {
    if (!q.question.trim() || q.options.some((o) => !o.trim())) {
      return { error: "Todas las preguntas y opciones deben tener texto." };
    }
  }

  const admin = createAdminClient();
  const { data: quiz, error } = await admin
    .from("quizzes")
    .insert({
      title: input.title,
      description: input.description || null,
      skill_id: input.skillId,
      difficulty: input.difficulty,
      created_by: staff.id,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  const rows = input.questions.map((q, i) => ({
    quiz_id: quiz.id,
    question: q.question,
    options: q.options,
    correct_index: q.correctIndex,
    sort_order: i,
  }));
  const { error: qError } = await admin.from("quiz_questions").insert(rows);
  if (qError) return { error: qError.message };

  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  return { success: true };
}

export async function deleteQuiz(quizId: string): Promise<ActionResult> {
  await requireInstructorOrStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("quizzes").delete().eq("id", quizId);
  if (error) return { error: error.message };
  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  return { success: true };
}

export async function submitQuizAttempt(quizId: string, answers: number[]) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_quiz_attempt", {
    p_quiz_id: quizId,
    p_answers: answers,
  });
  if (error) return { error: error.message };
  revalidatePath("/entrenamiento");
  revalidatePath("/dashboard");
  return { data };
}
