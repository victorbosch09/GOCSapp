"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireCommandStaff } from "@/lib/data/profile";
import { postToDiscord } from "@/lib/discord";

type ActionResult = { error?: string; success?: true };

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** Solo un miembro del trío (uno de los dos buddies) puede tocar su propio equipo. */
async function requireTeamMember(teamId: string, userId: string) {
  const admin = createAdminClient();
  const { data: team } = await admin
    .from("buddy_teams")
    .select("operator_a_id, operator_b_id, status")
    .eq("id", teamId)
    .single();
  if (!team) return null;
  if (team.operator_a_id !== userId && team.operator_b_id !== userId) return null;
  return team;
}

export async function formBuddyTeam(operatorBId: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };
  if (userId === operatorBId) return { error: "No podés formar equipo con vos mismo." };

  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, approved, rank:ranks(name)")
    .in("id", [userId, operatorBId]);

  const me = profiles?.find((p) => p.id === userId);
  const other = profiles?.find((p) => p.id === operatorBId);

  if (!me || !other) return { error: "Perfil no encontrado." };
  const rankOk = (p: typeof me) => (p as unknown as { rank: { name: string } | null }).rank?.name === "Operador lvl1";
  if (!me.approved || !other.approved || !rankOk(me) || !rankOk(other)) {
    return { error: "Ambos operadores deben ser aprobados y de rango Operador lvl1." };
  }

  const { data: existing } = await admin
    .from("buddy_teams")
    .select("id")
    .or(`operator_a_id.eq.${userId},operator_b_id.eq.${userId},operator_a_id.eq.${operatorBId},operator_b_id.eq.${operatorBId}`)
    .not("status", "in", "(graduado,disuelto)");
  if (existing && existing.length > 0) {
    return { error: "Uno de los dos ya está en un trío activo." };
  }

  const { error } = await admin.from("buddy_teams").insert({
    operator_a_id: userId,
    operator_b_id: operatorBId,
    created_by: userId,
  });
  if (error) return { error: error.message };

  revalidatePath("/buddy-system");
  return { success: true };
}

export async function draftAspirant(teamId: string, aspirantId: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };
  const team = await requireTeamMember(teamId, userId);
  if (!team) return { error: "No sos parte de este trío." };
  if (team.status !== "formando") return { error: "Este trío ya tiene un aspirante asignado." };

  const admin = createAdminClient();
  const { data: aspirant } = await admin
    .from("profiles")
    .select("id, approved, rank:ranks(name)")
    .eq("id", aspirantId)
    .single();
  if (!aspirant || !aspirant.approved || (aspirant as unknown as { rank: { name: string } | null }).rank?.name !== "Candidato") {
    return { error: "El aspirante debe ser un Candidato aprobado." };
  }

  const { data: taken } = await admin
    .from("buddy_teams")
    .select("id")
    .eq("aspirant_id", aspirantId)
    .not("status", "in", "(graduado,disuelto)");
  if (taken && taken.length > 0) return { error: "Ese candidato ya es aspirante de otro trío." };

  const { error } = await admin
    .from("buddy_teams")
    .update({ aspirant_id: aspirantId, status: "en_entrenamiento" })
    .eq("id", teamId);
  if (error) return { error: error.message };

  revalidatePath("/buddy-system");
  return { success: true };
}

export async function logBuddyActivity(teamId: string, note: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };
  if (!note.trim()) return { error: "Escribí algo para registrar." };
  const team = await requireTeamMember(teamId, userId);
  if (!team) return { error: "No sos parte de este trío." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("buddy_activities")
    .insert({ team_id: teamId, author_id: userId, note: note.trim() });
  if (error) return { error: error.message };

  revalidatePath("/buddy-system");
  return { success: true };
}

export async function rateBuddyAspirant(teamId: string, score: number, note: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };
  if (score < 1 || score > 5) return { error: "El puntaje debe ser entre 1 y 5." };
  const team = await requireTeamMember(teamId, userId);
  if (!team) return { error: "No sos parte de este trío." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("buddy_ratings")
    .insert({ team_id: teamId, rated_by: userId, score, note: note.trim() || null });
  if (error) return { error: error.message };

  revalidatePath("/buddy-system");
  return { success: true };
}

export async function markTeamReadyForPromotion(teamId: string): Promise<ActionResult> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };
  const team = await requireTeamMember(teamId, userId);
  if (!team) return { error: "No sos parte de este trío." };
  if (team.status !== "en_entrenamiento") return { error: "El trío no está en estado de entrenamiento." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("buddy_teams")
    .update({ status: "listo_para_ascender" })
    .eq("id", teamId);
  if (error) return { error: error.message };

  await postToDiscord(`🎓 Un trío del Buddy System marcó a su aspirante como listo para ascender.`, "notification");
  revalidatePath("/buddy-system");
  return { success: true };
}

// ============================================================
// MANDO
// ============================================================
export async function addBuddyMandoPoints(teamId: string, amount: number): Promise<ActionResult> {
  await requireCommandStaff();
  if (!Number.isFinite(amount) || amount === 0) return { error: "Ingresá un número distinto de cero." };

  const admin = createAdminClient();
  const { data: team } = await admin.from("buddy_teams").select("mando_points").eq("id", teamId).single();
  if (!team) return { error: "Trío no encontrado." };

  const { error } = await admin
    .from("buddy_teams")
    .update({ mando_points: team.mando_points + amount })
    .eq("id", teamId);
  if (error) return { error: error.message };

  revalidatePath("/admin/buddy-system");
  revalidatePath("/buddy-system");
  return { success: true };
}

/** Acredita el bono en créditos a los dos buddies (no al aspirante, que ya cobra su sueldo normal). */
export async function awardBuddyBonus(teamId: string, amount: number, note: string): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (!Number.isFinite(amount) || amount <= 0) return { error: "El bono debe ser mayor a 0." };

  const admin = createAdminClient();
  const { data: team } = await admin
    .from("buddy_teams")
    .select("operator_a_id, operator_b_id")
    .eq("id", teamId)
    .single();
  if (!team) return { error: "Trío no encontrado." };

  const detail = note.trim() || "Bono Buddy System";
  const { error: txnError } = await admin.from("transactions").insert([
    {
      profile_id: team.operator_a_id,
      type: "Bono",
      detail,
      amount,
      notes: "Bono Buddy System",
      created_by: staff.id,
    },
    {
      profile_id: team.operator_b_id,
      type: "Bono",
      detail,
      amount,
      notes: "Bono Buddy System",
      created_by: staff.id,
    },
  ]);
  if (txnError) return { error: txnError.message };

  const { error: bonusError } = await admin
    .from("buddy_bonuses")
    .insert({ team_id: teamId, awarded_by: staff.id, amount, note: note.trim() || null });
  if (bonusError) return { error: bonusError.message };

  revalidatePath("/admin/buddy-system");
  revalidatePath("/buddy-system");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function graduateBuddyTeam(teamId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin
    .from("buddy_teams")
    .update({ status: "graduado", graduated_at: new Date().toISOString() })
    .eq("id", teamId);
  if (error) return { error: error.message };

  revalidatePath("/admin/buddy-system");
  revalidatePath("/buddy-system");
  return { success: true };
}

export async function dissolveBuddyTeam(teamId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("buddy_teams").update({ status: "disuelto" }).eq("id", teamId);
  if (error) return { error: error.message };

  revalidatePath("/admin/buddy-system");
  revalidatePath("/buddy-system");
  return { success: true };
}
