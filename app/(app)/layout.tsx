import { getCurrentProfile } from "@/lib/data/profile";
import { AppNav } from "@/components/app-nav";
import { PendingApprovalScreen } from "@/components/pending-approval-screen";
import { RealtimeListener } from "@/components/realtime-listener";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  if (!profile.approved) {
    return <PendingApprovalScreen callsign={profile.callsign} />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeListener profileId={profile.id} />
      <AppNav isCommandStaff={profile.is_command_staff} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
