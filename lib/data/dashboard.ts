import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getOwnTransactions(limit = 20) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getOwnContracts(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getOwnNotifications(limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
