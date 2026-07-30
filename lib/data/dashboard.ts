import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ProfileWithRank } from "@/lib/data/profile";

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

/** Próximo lunes 00:00 hora local del servidor — ciclo semanal de pago. */
export function nextPaymentDate(): Date {
  const now = new Date();
  const next = new Date(now);
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  next.setDate(now.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function formatCredits(amount: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount) + " cr";
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function rankLabel(profile: ProfileWithRank): string {
  return profile.rank ? `${profile.rank.name} (${profile.rank.abbreviation})` : "Sin rango";
}
