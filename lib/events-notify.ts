import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { postToDiscord } from "@/lib/discord";
import { formatDateTime } from "@/lib/format";

const CHECK_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h — events older than this on first check are skipped, not backfilled.

/**
 * Opportunistic "el evento arrancó" Discord post. There's no per-minute cron
 * on the Hobby plan to fire this exactly at start_at, so instead it's
 * checked cheaply from page loads across the app (see (app)/layout.tsx and
 * (admin)/layout.tsx) — whoever's browsing shortly after an event starts
 * triggers it. events.start_notified_at makes this idempotent: the update
 * below only succeeds for whichever concurrent request gets there first,
 * so it can never double-post even if several people load a page at once.
 */
export async function checkAndNotifyStartedEvents(): Promise<void> {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const windowStart = new Date(now.getTime() - CHECK_WINDOW_MS);

    const { data: events } = await admin
      .from("events")
      .select("id, title, start_at")
      .in("event_type", ["entrenamiento", "operacion"])
      .is("start_notified_at", null)
      .gte("start_at", windowStart.toISOString())
      .lte("start_at", now.toISOString())
      .limit(5);

    if (!events || events.length === 0) return;

    for (const event of events) {
      const { data: claimed } = await admin
        .from("events")
        .update({ start_notified_at: new Date().toISOString() })
        .eq("id", event.id)
        .is("start_notified_at", null)
        .select("id")
        .maybeSingle();

      if (!claimed) continue; // another concurrent request already claimed this one

      const [{ count: totalApproved }, { data: rsvps }] = await Promise.all([
        admin.from("profiles").select("id", { count: "exact", head: true }).eq("approved", true),
        admin.from("event_rsvps").select("response").eq("event_id", event.id),
      ]);

      const asiste = (rsvps ?? []).filter((r) => r.response === "asiste").length;
      const talVez = (rsvps ?? []).filter((r) => r.response === "tal_vez").length;
      const marcaron = rsvps?.length ?? 0;
      const sinMarcar = Math.max(0, (totalApproved ?? 0) - marcaron);

      const lines = [
        `🟢 **¡${event.title} arrancó!** (${formatDateTime(event.start_at)})`,
        `Marcaron asistencia: ${marcaron}/${totalApproved ?? 0} — ✅ Asisten: ${asiste} · 🤔 Tal vez: ${talVez}`,
      ];
      if (sinMarcar > 0) lines.push(`⚠️ Sin marcar todavía: ${sinMarcar}`);

      await postToDiscord(lines.join("\n"), "event");
    }
  } catch (err) {
    // Nunca debe romper una página por esto — es un chequeo de fondo.
    console.error("[checkAndNotifyStartedEvents]", err);
  }
}
