"use server";

import { revalidatePath } from "next/cache";
import { requireInstructorOrStaff } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SkillResult } from "@/types/database";

type ActionResult = { error?: string; success?: true };

export async function createSkill(input: {
  name: string;
  category: string;
  description: string;
}): Promise<ActionResult> {
  await requireInstructorOrStaff();
  if (!input.name.trim()) return { error: "El nombre es obligatorio." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("skills")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await admin.from("skills").insert({
    name: input.name,
    category: input.category || null,
    description: input.description || null,
    sort_order: nextSort,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  return { success: true };
}

export async function evaluateSkill(input: {
  profileId: string;
  skillId: string;
  result: SkillResult;
  score: number | null;
  notes: string;
}): Promise<ActionResult> {
  const staff = await requireInstructorOrStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("skill_evaluations").insert({
    profile_id: input.profileId,
    skill_id: input.skillId,
    result: input.result,
    score: input.score,
    notes: input.notes || null,
    evaluated_by: staff.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteEvaluation(evaluationId: string): Promise<ActionResult> {
  await requireInstructorOrStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("skill_evaluations").delete().eq("id", evaluationId);
  if (error) return { error: error.message };
  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  return { success: true };
}

export async function addTrainingMaterial(input: {
  title: string;
  description: string;
  url: string;
  category: string;
}): Promise<ActionResult> {
  const staff = await requireInstructorOrStaff();
  if (!input.title.trim()) return { error: "El título es obligatorio." };

  const admin = createAdminClient();
  const { error } = await admin.from("training_materials").insert({
    title: input.title,
    description: input.description || null,
    url: input.url || null,
    category: input.category || null,
    uploaded_by: staff.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  return { success: true };
}

export async function deleteTrainingMaterial(materialId: string): Promise<ActionResult> {
  await requireInstructorOrStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("training_materials").delete().eq("id", materialId);
  if (error) return { error: error.message };
  revalidatePath("/admin/entrenamiento");
  revalidatePath("/entrenamiento");
  return { success: true };
}
