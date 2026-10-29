import { after } from "next/server";
import { getCurrentProfile, noAdminExistsYet } from "@/lib/data/profile";
import { getUnreadNotificationCount } from "@/lib/data/dashboard";
import { checkAndNotifyStartedEvents } from "@/lib/events-notify";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppNav } from "@/components/app-nav";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";
import { RealtimeListener } from "@/components/realtime-listener";
import { CommandPalette } from "@/components/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  after(() => checkAndNotifyStartedEvents());
  after(() => {
    const admin = createAdminClient();
    admin.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", profile.id).then(() => {});
  });

  if (!profile.approved) {
    const showFounderClaim = !profile.is_command_staff && (await noAdminExistsYet());
    return <PendingApprovalScreen callsign={profile.callsign} showFounderClaim={showFounderClaim} />;
  }

  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <RealtimeListener profileId={profile.id} />
      <CommandPalette isCommandStaff={profile.is_command_staff} />
      <AppNav isCommandStaff={profile.is_command_staff} unreadCount={unreadCount} />
      {/* Desktop: offset for sidebar. Mobile: offset for top bar + bottom tab bar */}
      <main
        id="main-content"
        className="flex-1 lg:ml-56 px-4 py-6 pb-24 lg:pb-8 pt-20 lg:pt-8 max-w-full"
      >
        <div className="mx-auto max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
