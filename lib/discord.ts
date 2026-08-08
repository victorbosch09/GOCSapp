import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Best-effort post to the clan's configured Discord webhook. Never throws —
 * a broken/rate-limited webhook must not block the action that triggered it
 * (creating an event, sending a notification). Errors are logged server-side
 * only.
 */
export async function postToDiscord(content: string, kind: "event" | "notification") {
  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("integration_settings")
    .select("discord_webhook_url, notify_on_event, notify_on_notification")
    .eq("id", true)
    .single();

  if (!settings?.discord_webhook_url) return;
  if (kind === "event" && !settings.notify_on_event) return;
  if (kind === "notification" && !settings.notify_on_notification) return;

  try {
    await fetch(settings.discord_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
  } catch (err) {
    console.error("[discord webhook]", err);
  }
}
