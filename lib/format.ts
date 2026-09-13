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

// Zona horaria fija del clan (Colombia/Perú/Ecuador, UTC-5). Fijarla acá en
// vez de dejar que Intl use la zona del dispositivo asegura que la hora de
// un evento se vea igual para todo el mundo, sin importar en qué zona
// horaria esté el navegador de quien lo mira — y sin importar si el
// renderizado ocurre en el servidor (UTC en Vercel) o en el cliente.
const CLAN_TIMEZONE = "America/Bogota";

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: CLAN_TIMEZONE,
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CLAN_TIMEZONE,
  }).format(date);
}

/** Offset (en minutos, UTC menos zona) de `timeZone` en el instante `date`. */
function timeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return (asUtc - date.getTime()) / 60000;
}

/**
 * Convierte un valor de <input type="datetime-local"> (texto sin zona,
 * ej. "2026-09-20T18:00"), interpretado como hora de CLAN_TIMEZONE, a un
 * ISO string UTC correcto — sin importar en qué zona horaria esté el
 * navegador de quien lo está tipeando.
 */
export function clanLocalInputToISO(localValue: string): string {
  const [datePart, timePart] = localValue.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number);
  const naiveUtc = Date.UTC(y, m - 1, d, hh, mm);
  const offsetMinutes = timeZoneOffsetMinutes(CLAN_TIMEZONE, new Date(naiveUtc));
  return new Date(naiveUtc - offsetMinutes * 60000).toISOString();
}

/**
 * Inversa de clanLocalInputToISO: convierte un ISO string a un valor de
 * <input type="datetime-local"> mostrando la hora de CLAN_TIMEZONE, para
 * precargar el formulario de edición con la misma hora que ve todo el
 * clan (no la del navegador de quien edita).
 */
export function isoToClanLocalInput(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLAN_TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function rankLabel(profile: ProfileWithRank): string {
  return profile.rank ? `${profile.rank.name} (${profile.rank.abbreviation})` : "Sin rango";
}

/** Días transcurridos desde una fecha, redondeados hacia abajo. */
export function daysSince(value: string | Date): number {
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}
