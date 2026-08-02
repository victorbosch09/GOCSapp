import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * IMPORTANT: every "own X" query here must filter by profile_id explicitly.
 * RLS alone is not enough to scope these to "mine" — command staff (and,
 * for training tables, instructors) are intentionally granted broad read
 * access for admin views, so an unfiltered query run from a staff/instructor
 * session would silently return every soldier's rows here instead of just
 * theirs. Never remove these .eq("profile_id", ...) filters.
 */
async function currentUserId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getOwnTransactions(limit = 20) {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return [];
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getOwnContracts(limit = 10) {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return [];
  const { data } = await supabase
    .from("contracts")
    .select("*")
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getOwnInventory() {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return [];
  const { data } = await supabase
    .from("inventory")
    .select("*")
    .eq("profile_id", userId)
    .order("acquired_at", { ascending: false });
  return data ?? [];
}

export async function getOwnNotifications(limit = 10) {
  const supabase = await createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return [];

  const { data: profile } = await supabase.from("profiles").select("squad").eq("id", userId).single();

  const orParts = [`target_type.eq.all`, `and(target_type.eq.profile,target_id.eq.${userId})`];
  if (profile?.squad) {
    orParts.push(`and(target_type.eq.squad,target_id.eq.${profile.squad})`);
  }

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .or(orParts.join(","))
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
