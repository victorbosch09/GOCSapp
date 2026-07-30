"use server";

import { revalidatePath } from "next/cache";
import { requireCommandStaff } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EventType, NotificationTarget, SanctionSeverity, TransactionType } from "@/types/database";

type ActionResult = { error?: string; success?: true };

const CATALOG_TABLES = ["weapons", "equipment", "accessories", "vehicles"] as const;
type CatalogTable = (typeof CATALOG_TABLES)[number];

// ============================================================
// ADMISIÓN / ROSTER
// ============================================================
export async function approveProfile(profileId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ approved: true }).eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/equipo");
  return { success: true };
}

export async function updateProfileRank(profileId: string, rankId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ rank_id: rankId }).eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/equipo");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfileSquad(profileId: string, squad: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ squad: squad || null })
    .eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/equipo");
  return { success: true };
}

/** Otorga o revoca acceso al panel de mando sobre otro perfil. */
export async function setCommandStaff(profileId: string, isStaff: boolean): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (profileId === staff.id && !isStaff) {
    return { error: "No podés quitarte mando a vos mismo." };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_command_staff: isStaff })
    .eq("id", profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  return { success: true };
}

export async function manualAdjustment(
  profileId: string,
  amount: number,
  notes: string
): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (!amount) return { error: "El monto no puede ser cero." };
  const admin = createAdminClient();
  const { error } = await admin.from("transactions").insert({
    profile_id: profileId,
    type: "Ajuste Manual",
    detail: "Ajuste manual",
    amount,
    notes,
    created_by: staff.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================
// LIBRO DE MOVIMIENTOS — edición/borrado completo (corrección de errores)
// ============================================================
export async function updateTransaction(
  transactionId: string,
  patch: { amount?: number; type?: TransactionType; detail?: string | null; notes?: string | null }
): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("transactions").update(patch).eq("id", transactionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function listTransactions(profileId: string) {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { data } = await admin
    .from("transactions")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function deleteTransaction(transactionId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("transactions").delete().eq("id", transactionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================
// RANGOS — editar sueldo/descripción/requisito (no se permite borrar:
// romper la referencia de un rango en uso dejaría soldados sin rango)
// ============================================================
export async function updateRank(
  rankId: string,
  patch: {
    weekly_wage?: number;
    description?: string | null;
    promotion_requirement?: string | null;
  }
): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("ranks").update(patch).eq("id", rankId);
  if (error) return { error: error.message };
  revalidatePath("/admin/rangos");
  revalidatePath("/dashboard");
  return { success: true };
}

/** Borra completamente la cuenta de un operador (para bajas del clan). */
export async function deleteProfile(profileId: string): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (profileId === staff.id) {
    return { error: "No podés borrar tu propia cuenta desde acá." };
  }
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/equipo");
  return { success: true };
}

// ============================================================
// CATÁLOGO
// ============================================================
export async function updateCatalogItem(
  table: CatalogTable,
  id: string,
  patch: { price?: number; in_stock?: boolean; notes?: string | null }
): Promise<ActionResult> {
  await requireCommandStaff();
  if (!CATALOG_TABLES.includes(table)) return { error: "Categoría inválida." };
  const admin = createAdminClient();
  const { error } = await admin.from(table).update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/catalogo");
  revalidatePath("/tienda");
  return { success: true };
}

// ============================================================
// CONTRATOS
// ============================================================
export async function logContract(input: {
  profileIds: string[];
  riskLevel: number | null;
  bonusLabels: string[];
  notes: string;
}): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (input.profileIds.length === 0) return { error: "Seleccioná al menos un soldado." };

  const admin = createAdminClient();
  const { data: bonusTypes } = await admin
    .from("contract_bonus_types")
    .select("label, amount")
    .in("label", input.bonusLabels.length > 0 ? input.bonusLabels : [""]);

  const total = (bonusTypes ?? []).reduce((sum, b) => sum + b.amount, 0);
  if (total <= 0) return { error: "Seleccioná al menos un bono con monto." };

  const { error } = await admin.rpc("log_contract", {
    p_profile_ids: input.profileIds,
    p_risk_level: input.riskLevel,
    p_bonuses: input.bonusLabels,
    p_total_amount: total,
    p_logged_by: staff.id,
    p_notes: input.notes || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/soldados");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================
// NOTIFICACIONES
// ============================================================
export async function sendNotification(input: {
  title: string;
  body: string;
  targetType: NotificationTarget;
  targetId: string | null;
}): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (!input.title.trim()) return { error: "El título es obligatorio." };
  if (input.targetType !== "all" && !input.targetId) {
    return { error: "Falta el destinatario (soldado o escuadra)." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("notifications").insert({
    title: input.title,
    body: input.body || null,
    target_type: input.targetType,
    target_id: input.targetType === "all" ? null : input.targetId,
    created_by: staff.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/notificaciones");
  return { success: true };
}

// ============================================================
// RECOMPENSAS
// ============================================================
export async function awardReward(input: {
  profileId: string;
  title: string;
  description: string;
  amount: number | null;
}): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (!input.title.trim()) return { error: "El título es obligatorio." };

  const admin = createAdminClient();
  let transactionId: string | null = null;

  if (input.amount) {
    const { data: txn, error: txnError } = await admin
      .from("transactions")
      .insert({
        profile_id: input.profileId,
        type: "Ajuste Manual",
        detail: `Recompensa: ${input.title}`,
        amount: input.amount,
        notes: input.description || null,
        created_by: staff.id,
      })
      .select("id")
      .single();
    if (txnError) return { error: txnError.message };
    transactionId = txn.id;
  }

  const { error: rewardError } = await admin.from("rewards").insert({
    profile_id: input.profileId,
    title: input.title,
    description: input.description || null,
    amount: input.amount,
    awarded_by: staff.id,
    transaction_id: transactionId,
  });
  if (rewardError) return { error: rewardError.message };

  revalidatePath("/admin/recompensas");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateReward(
  rewardId: string,
  patch: { title?: string; description?: string | null }
): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("rewards").update(patch).eq("id", rewardId);
  if (error) return { error: error.message };
  revalidatePath("/admin/recompensas");
  return { success: true };
}

export async function deleteReward(rewardId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { data: reward } = await admin
    .from("rewards")
    .select("transaction_id")
    .eq("id", rewardId)
    .single();
  if (reward?.transaction_id) {
    await admin.from("transactions").delete().eq("id", reward.transaction_id);
  }
  const { error } = await admin.from("rewards").delete().eq("id", rewardId);
  if (error) return { error: error.message };
  revalidatePath("/admin/recompensas");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================
// SANCIONES
// ============================================================
export async function applySanction(input: {
  profileId: string;
  sanctionTypeId: string | null;
  severity: SanctionSeverity;
  description: string;
  amountDeducted: number | null;
}): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  const admin = createAdminClient();
  let transactionId: string | null = null;

  if (input.amountDeducted && input.amountDeducted > 0) {
    const { data: txn, error: txnError } = await admin
      .from("transactions")
      .insert({
        profile_id: input.profileId,
        type: "Descuento",
        detail: `Sanción (${input.severity})`,
        amount: -Math.abs(input.amountDeducted),
        notes: input.description || null,
        created_by: staff.id,
      })
      .select("id")
      .single();
    if (txnError) return { error: txnError.message };
    transactionId = txn.id;
  }

  const { error: sanctionError } = await admin.from("sanctions").insert({
    profile_id: input.profileId,
    sanction_type_id: input.sanctionTypeId,
    severity: input.severity,
    description: input.description || null,
    amount_deducted: input.amountDeducted,
    applied_by: staff.id,
    transaction_id: transactionId,
  });
  if (sanctionError) return { error: sanctionError.message };

  revalidatePath("/admin/sanciones");
  revalidatePath("/admin/soldados");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSanction(
  sanctionId: string,
  patch: { severity?: SanctionSeverity; description?: string | null }
): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("sanctions").update(patch).eq("id", sanctionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/sanciones");
  return { success: true };
}

export async function deleteSanction(sanctionId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { data: sanction } = await admin
    .from("sanctions")
    .select("transaction_id")
    .eq("id", sanctionId)
    .single();
  if (sanction?.transaction_id) {
    await admin.from("transactions").delete().eq("id", sanction.transaction_id);
  }
  const { error } = await admin.from("sanctions").delete().eq("id", sanctionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/sanciones");
  revalidatePath("/admin/soldados");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function createSanctionType(input: {
  severity: SanctionSeverity;
  label: string;
  description: string;
}): Promise<ActionResult> {
  await requireCommandStaff();
  if (!input.label.trim()) return { error: "El nombre de la sanción es obligatorio." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("sanction_types")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = (existing?.[0]?.sort_order ?? 0) + 1;

  const { error } = await admin.from("sanction_types").insert({
    severity: input.severity,
    label: input.label,
    description: input.description || null,
    sort_order: nextSort,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/sanciones");
  return { success: true };
}

// ============================================================
// NÓMINA SEMANAL
// ============================================================
export async function runPayrollNow(): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.rpc("run_weekly_payroll", { p_triggered_by: staff.id });
  if (error) return { error: error.message };
  revalidatePath("/admin/nomina");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================
// CALENDARIO
// ============================================================
export async function createEvent(input: {
  title: string;
  description: string;
  eventType: EventType;
  startAt: string;
  endAt: string | null;
}): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (!input.title.trim() || !input.startAt) return { error: "Faltan datos del evento." };

  const admin = createAdminClient();
  const { error } = await admin.from("events").insert({
    title: input.title,
    description: input.description || null,
    event_type: input.eventType,
    start_at: new Date(input.startAt).toISOString(),
    end_at: input.endAt ? new Date(input.endAt).toISOString() : null,
    created_by: staff.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { success: true };
}

export async function updateEvent(
  eventId: string,
  input: {
    title: string;
    description: string;
    eventType: EventType;
    startAt: string;
    endAt: string | null;
  }
): Promise<ActionResult> {
  await requireCommandStaff();
  if (!input.title.trim() || !input.startAt) return { error: "Faltan datos del evento." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("events")
    .update({
      title: input.title,
      description: input.description || null,
      event_type: input.eventType,
      start_at: new Date(input.startAt).toISOString(),
      end_at: input.endAt ? new Date(input.endAt).toISOString() : null,
    })
    .eq("id", eventId);

  if (error) return { error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { success: true };
}
