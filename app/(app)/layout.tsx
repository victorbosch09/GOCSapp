import { getCurrentProfile, noAdminExistsYet } from "@/lib/data/profile";
import { getUnreadNotificationCount } from "@/lib/data/dashboard";
import { AppNav } from "@/components/app-nav";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";
import { RealtimeListener } from "@/components/realtime-listener";
import { CommandPalette } from "@/components/command-palette";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile.approved) {
    const showFounderClaim = !profile.is_command_staff && (await noAdminExistsYet());
    return <PendingApprovalScreen callsign={profile.callsign} showFounderClaim={showFounderClaim} />;
  }

  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-3 focus-visible:py-2 focus-visible:text-primary-foreground"
      >
        Saltar al contenido
      </a>
      <RealtimeListener profileId={profile.id} />
      <CommandPalette isCommandStaff={profile.is_command_staff} />
      <AppNav isCommandStaff={profile.is_command_staff} unreadCount={unreadCount} />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
