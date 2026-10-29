"use server";

import { revalidatePath } from "next/cache";
import { requireCommandStaff, getCurrentProfile } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { postToDiscord } from "@/lib/discord";
import { formatDateTime } from "@/lib/format";
import type { EventType, RsvpResponse } from "@/types/database";

type ActionResult = { error?: string; success?: true; id?: string };

const EVENT_TYPE_LABEL: Record<EventType, string> = {
  entrenamiento: "Entrenamiento",
  operacion: "Operación",
  pago: "Pago",
  otro: "Otro",
};

export async function createEvent(input: {
  title: string;
  description: string;
  event_type: EventType;
  start_at: string;
  end_at: string;
  instructor_id: string;
  max_participants: string;
  requires_signup: boolean;
}): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  if (!input.title.trim()) return { error: "El título es obligatorio." };
  if (!input.start_at) return { error: "La fecha de inicio es obligatoria." };

  const admin = createAdminClient();
  const { data, error } = await admin.from("events").insert({
    title: input.title.trim(),
    description: input.description.trim() || null,
    event_type: input.event_type,
    start_at: input.start_at,
    end_at: input.end_at || null,
    instructor_id: input.instructor_id || null,
    max_participants: input.max_participants ? parseInt(input.max_participants) : null,
    requires_signup: input.requires_signup,
    created_by: staff.id,
  }).select("id").single();

  if (error) return { error: error.message };

  const label = EVENT_TYPE_LABEL[input.event_type];
  const dateStr = formatDateTime(input.start_at);
  await postToDiscord(
    `📅 **Nuevo evento programado — ${label}**\n**${input.title}**\n🕐 ${dateStr}${input.description ? `\n${input.description}` : ""}`,
    "event"
  );

  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true, id: data.id };
}

export async function rsvpEvent(eventId: string, response: RsvpResponse): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const { error } = await supabase.from("event_rsvps").upsert(
    { event_id: eventId, profile_id: user.id, response, responded_at: new Date().toISOString() },
    { onConflict: "event_id,profile_id" }
  );

  if (error) return { error: error.message };
  revalidatePath("/calendario");
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/calendario");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getOperatorsForSelect() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, callsign, is_instructor, is_command_staff")
    .eq("approved", true)
    .or("is_instructor.eq.true,is_command_staff.eq.true")
    .order("callsign");
  return data ?? [];
}
