import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RsvpResponse } from "@/types/database";

/**
 * Inbound RSVP webhook. Built to receive a "marcó Discord" update from
 * whatever can call it — GOCS doesn't control Apollo (the clan's Discord
 * RSVP bot) and has no verified way to make Apollo call this itself; this
 * is the receiving half only. Wire it up from Apollo's own integration
 * settings if it has one, or a small relay watching the RSVP channel.
 *
 * POST /api/webhooks/attendance
 * Header: X-Webhook-Secret: <attendance_webhook_secret from /admin/notificaciones>
 * Body: {
 *   discord_username: string,       // matched case-insensitively against profiles.discord_username
 *   response: "asiste" | "tal_vez" | "no_asiste",
 *   event_id?: string,              // preferred: the GOCS event id
 *   event_date?: string             // fallback: ISO date, matches the closest event that day
 * }
 */
export async function POST(request: Request) {
  const secretHeader = request.headers.get("x-webhook-secret");
  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("integration_settings")
    .select("attendance_webhook_secret")
    .eq("id", true)
    .single();

  if (!settings?.attendance_webhook_secret) {
    return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });
  }
  if (!secretHeader || secretHeader !== settings.attendance_webhook_secret) {
    return NextResponse.json({ error: "Secreto inválido." }, { status: 401 });
  }

  let body: {
    discord_username?: string;
    response?: string;
    event_id?: string;
    event_date?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const VALID_RESPONSES: RsvpResponse[] = ["asiste", "tal_vez", "no_asiste"];
  if (!body.discord_username || !VALID_RESPONSES.includes(body.response as RsvpResponse)) {
    return NextResponse.json(
      { error: "Faltan discord_username o response (asiste/tal_vez/no_asiste)." },
      { status: 400 }
    );
  }

  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("discord_username", body.discord_username)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json(
      { error: `Ningún operador tiene "${body.discord_username}" como usuario de Discord.` },
      { status: 404 }
    );
  }

  let eventId = body.event_id ?? null;
  if (!eventId && body.event_date) {
    const dayStart = new Date(body.event_date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const { data: event } = await admin
      .from("events")
      .select("id")
      .gte("start_at", dayStart.toISOString())
      .lt("start_at", dayEnd.toISOString())
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    eventId = event?.id ?? null;
  }

  if (!eventId) {
    return NextResponse.json(
      { error: "No se encontró el evento (mandá event_id o event_date)." },
      { status: 404 }
    );
  }

  const { error } = await admin.from("event_rsvps").upsert(
    {
      event_id: eventId,
      profile_id: profile.id,
      response: body.response as RsvpResponse,
      responded_at: new Date().toISOString(),
    },
    { onConflict: "event_id,profile_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
