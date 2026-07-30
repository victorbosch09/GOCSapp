"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCommandStaff } from "@/lib/data/profile";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RsvpResponse } from "@/types/database";

type ActionResult = { error?: string; success?: true };

/** Autoservicio: cada soldado carga su propia respuesta de Discord. */
export async function rsvpToEvent(eventId: string, response: RsvpResponse): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };

  const { error } = await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, profile_id: user.id, response, responded_at: new Date().toISOString() },
      { onConflict: "event_id,profile_id" }
    );

  if (error) return { error: error.message };
  revalidatePath("/asistencia");
  revalidatePath("/calendario");
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
