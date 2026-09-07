import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function getTreasury() {
  const supabase = await createClient();
  const { data } = await supabase.from("treasury").select("*").eq("id", true).single();
  return data;
}

/**
 * Weekly-bucketed cumulative balance, computed from every transaction ever
 * recorded (not just the last 50 shown in the ledger UI) so the running
 * total starts accurately at zero instead of an arbitrary truncation point.
 */
export async function getTreasuryBalanceHistory() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("treasury_transactions")
    .select("amount, created_at")
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return [];

  const weekly = new Map<string, number>();
  let running = 0;
  for (const t of data) {
    running += t.amount;
    const d = new Date(t.created_at);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    weekly.set(key, running);
  }

  return Array.from(weekly.entries()).map(([weekOf, balance]) => ({ weekOf, balance }));
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
