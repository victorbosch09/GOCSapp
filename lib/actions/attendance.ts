"use server";

import { revalidatePath } from "next/cache";
import { requireCommandStaff } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RsvpResponse } from "@/types/database";

type ActionResult = { error?: string; success?: true };

/**
 * Solo mando: carga lo que el soldado marcó en Discord (asiste/tal
 * vez/no asiste), o borra el registro si se elige "sin marcar". No es
 * autoservicio — no todos entran a la web a marcar su respuesta, así que
 * el mando la transcribe desde Discord.
 */
export async function setDiscordRsvp(
  eventId: string,
  profileId: string,
  response: RsvpResponse | null
): Promise<ActionResult> {
  await requireCommandStaff();
  const admin = createAdminClient();

  if (response === null) {
    const { error } = await admin
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", profileId);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("event_rsvps").upsert(
      { event_id: eventId, profile_id: profileId, response, responded_at: new Date().toISOString() },
      { onConflict: "event_id,profile_id" }
    );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/asistencia");
  revalidatePath("/asistencia");
  return { success: true };
}

/** Solo mando: marca la asistencia real luego de la actividad. */
export async function markAttendance(
  eventId: string,
  profileId: string,
  attended: boolean
): Promise<ActionResult> {
  const staff = await requireCommandStaff();
  const admin = createAdminClient();
  const { error } = await admin.from("event_attendance").upsert(
    {
      event_id: eventId,
      profile_id: profileId,
      attended,
      marked_by: staff.id,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "event_id,profile_id" }
  );
  if (error) return { error: error.message };
  revalidatePath("/admin/asistencia");
  revalidatePath("/asistencia");
  return { success: true };
}
