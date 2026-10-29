/**
 * POST /api/discord/log-evaluation
 *
 * Discord bot bridge: allows an authorized Discord bot to log a skill evaluation
 * for an operator directly into Supabase, then triggers a revalidation.
 *
 * Body (JSON):
 *   {
 *     "secret": "<BOT_API_SECRET env var>",
 *     "discord_username": "XxHypexx75",
 *     "skill_name": "Mod 2 — Saltos, Repliegues y CQB Básico",
 *     "result": "aprobado" | "no_aprobado" | "en_progreso",
 *     "instructor_discord": "CPT Dusty",   // optional, for notes
 *     "notes": "Aprobado con distinción"   // optional
 *   }
 *
 * Setup:
 *   1. Add BOT_API_SECRET to your Vercel environment variables.
 *   2. In your Discord bot, call this endpoint with the secret when an instructor
 *      runs /aprobar @usuario <modulo> in your Discord server.
 *
 * Returns:
 *   200 { success: true, evaluation_id: "..." }
 *   400 { error: "..." }
 *   401 { error: "Unauthorized" }
 *   404 { error: "profile not found" | "skill not found" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });

  const { secret, discord_username, skill_name, result, instructor_discord, notes } = body as {
    secret?: string;
    discord_username?: string;
    skill_name?: string;
    result?: string;
    instructor_discord?: string;
    notes?: string;
  };

  // Auth check
  const expectedSecret = process.env.BOT_API_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Validate inputs
  if (!discord_username) return NextResponse.json({ error: "discord_username is required." }, { status: 400 });
  if (!skill_name) return NextResponse.json({ error: "skill_name is required." }, { status: 400 });
  if (!["aprobado", "no_aprobado", "en_progreso"].includes(result ?? "")) {
    return NextResponse.json({ error: "result must be aprobado | no_aprobado | en_progreso." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find profile by discord_username
  const { data: profile } = await admin
    .from("profiles")
    .select("id, callsign")
    .ilike("discord_username", discord_username)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: `No profile found for Discord user: ${discord_username}` }, { status: 404 });
  }

  // Find skill by name (partial match)
  const { data: skills } = await admin
    .from("skills")
    .select("id, name")
    .ilike("name", `%${skill_name}%`)
    .limit(1);
  const skill = skills?.[0];
  if (!skill) {
    return NextResponse.json({ error: `No skill found matching: ${skill_name}` }, { status: 404 });
  }

  const evalNotes = [
    instructor_discord ? `Aprobado por instructor: ${instructor_discord}` : null,
    notes ?? null,
    "Registrado vía bot de Discord",
  ]
    .filter(Boolean)
    .join(" | ");

  const { data: ev, error } = await admin.from("skill_evaluations").insert({
    profile_id: profile.id,
    skill_id: skill.id,
    result: result as "aprobado" | "no_aprobado" | "en_progreso",
    score: null,
    notes: evalNotes,
    evaluated_by: null,
    source: "bot",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    evaluation_id: ev.id,
    operator: profile.callsign,
    skill: skill.name,
    result,
  });
}
