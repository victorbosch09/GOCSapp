"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionResult = { error?: string; success?: true };

/**
 * Self-service profile edit. Only ever touches bio/avatar_url — never
 * balance, rank, approval or staff flags — even though it uses the admin
 * client to bypass RLS for the write.
 */
export async function updateOwnProfile(input: {
  bio: string;
  avatarUrl: string;
  discordUsername?: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  if (input.bio.length > 500) return { error: "La bio es demasiado larga (máx 500 caracteres)." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      bio: input.bio || null,
      avatar_url: input.avatarUrl || null,
      discord_username: input.discordUsername?.trim() || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/equipo");
  return { success: true };
}

export async function markOnboarded(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ onboarded: true }).eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * One-time self-service claim of the first command-staff seat. Safe by
 * construction: bootstrap_first_admin() re-checks server-side (inside the
 * SECURITY DEFINER function, not just via the UI gate) that zero
 * is_command_staff rows exist before promoting the caller.
 */
export async function claimFounderAccess(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  const { error } = await supabase.rpc("bootstrap_first_admin");
  if (error) return { error: error.message };

  revalidatePath("/dashboard", "layout");
  return { success: true };
}

/** Autoservicio genuino: la RLS de notification_reads ya restringe el insert a profile_id = auth.uid(), no hace falta el admin client. */
export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase
    .from("notification_reads")
    .upsert(
      { notification_id: notificationId, profile_id: user.id },
      { onConflict: "notification_id,profile_id", ignoreDuplicates: true }
    );
  if (error) return { error: error.message };
  // 'layout' revalidates app/(app)/layout.tsx too, so the unread badge in
  // AppNav updates along with the dashboard list itself.
  revalidatePath("/dashboard", "layout");
  return { success: true };
}

export async function claimDailyReward(): Promise<ActionResult & { streak?: number; credited?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("login_streak, last_login_date, cached_balance")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Perfil no encontrado." };

  const todayStr = new Date().toISOString().split("T")[0];
  if (profile.last_login_date === todayStr) return { error: "Ya reclamaste tu recompensa de hoy." };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const newStreak = profile.last_login_date === yesterdayStr ? (profile.login_streak ?? 0) + 1 : 1;

  let credited = 50;
  let detail = `Acceso diario — Racha día ${newStreak}`;
  if (newStreak === 7) { credited += 200; detail = "Racha 7 días — bonus de lealtad"; }
  else if (newStreak === 30) { credited += 500; detail = "Racha 30 días — bonus elite"; }

  const admin = createAdminClient();
  await admin.from("profiles").update({
    login_streak: newStreak,
    last_login_date: todayStr,
    cached_balance: (profile.cached_balance ?? 0) + credited,
  }).eq("id", user.id);

  await admin.from("transactions").insert({
    profile_id: user.id,
    type: "Bono",
    amount: credited,
    detail,
  });

  revalidatePath("/dashboard");
  return { success: true, streak: newStreak, credited };
}

export async function markAllNotificationsRead(notificationIds: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };
  if (notificationIds.length === 0) return { success: true };

  const { error } = await supabase
    .from("notification_reads")
    .upsert(
      notificationIds.map((id) => ({ notification_id: id, profile_id: user.id })),
      { onConflict: "notification_id,profile_id", ignoreDuplicates: true }
    );
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
