import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getTreasury() {
  const supabase = await createClient();
  const { data } = await supabase.from("treasury").select("*").eq("id", true).single();
  return data;
}

export async function getTreasuryTransactions(limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("treasury_transactions")
    .select("*, actor:profiles(callsign)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as (import("@/types/database").TreasuryTransaction & {
    actor: { callsign: string } | null;
  })[];
}
