// Pure formatting helpers — safe to import from Client Components.
// Server-only data fetchers live in lib/data/*, never here.
import type { ProfileWithRank } from "@/lib/data/profile";

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

/** Días transcurridos desde una fecha, redondeados hacia abajo. */
export function daysSince(value: string | Date): number {
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}
