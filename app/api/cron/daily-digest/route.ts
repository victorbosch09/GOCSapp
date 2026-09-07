import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/format";

/**
 * Runs once a day (Vercel Cron, see vercel.json — Hobby plan only allows
 * daily granularity, not a precise "1 hour before" reminder) and posts a
 * digest of events happening in the next 48h to the configured Discord
 * webhook, if any. Fine-grained per-event reminders would need a Pro plan
 * with higher-frequency cron.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("integration_settings")
    .select("discord_webhook_url")
    .eq("id", true)
    .single();

  if (!settings?.discord_webhook_url) {
    return NextResponse.json({ skipped: "Sin webhook configurado." });
  }

  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const { data: events } = await admin
    .from("events")
    .select("title, event_type, start_at")
    .in("event_type", ["entrenamiento", "operacion"])
    .gte("start_at", now.toISOString())
    .lt("start_at", in48h.toISOString())
    .order("start_at", { ascending: true });

  if (!events || events.length === 0) {
    return NextResponse.json({ skipped: "Sin eventos en las próximas 48h." });
  }

  const lines = events.map((e) => `• **${e.title}** — ${formatDateTime(e.start_at)}`);
  const content = `📅 **Próximos eventos (48h):**\n${lines.join("\n")}`;

  const res = await fetch(settings.discord_webhook_url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  return NextResponse.json({ sent: events.length, discordStatus: res.status });
}
