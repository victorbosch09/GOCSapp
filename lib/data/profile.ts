import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Rank } from "@/types/database";

export type ProfileWithRank = Profile & { rank: Rank | null };

/**
 * Verifies the session and loads the caller's profile (+ rank). Redirects to
 * /login if there is no session. Memoized per-request via React `cache`.
 */
export const getCurrentProfile = cache(async (): Promise<ProfileWithRank> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, rank:ranks(*)")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return profile as unknown as ProfileWithRank;
});

/**
 * Same as getCurrentProfile but also asserts the caller is command staff.
 * Call this at the top of every admin Server Action, not just in the layout
 * — client-side route protection alone is not sufficient authorization.
 */
export const requireCommandStaff = cache(async (): Promise<ProfileWithRank> => {
  const profile = await getCurrentProfile();
  if (!profile.is_command_staff) {
    redirect("/dashboard");
  }
  return profile;
});
