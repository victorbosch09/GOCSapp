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
    .update({ bio: input.bio || null, avatar_url: input.avatarUrl || null })
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
