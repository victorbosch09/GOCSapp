import { requireCommandStaff } from "@/lib/data/profile";
import { AppNav } from "@/components/app-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { RealtimeListener } from "@/components/realtime-listener";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireCommandStaff();

  return (
    <div className="flex min-h-screen flex-col">
      <RealtimeListener profileId={profile.id} />
      <AppNav isCommandStaff />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row">
        <AdminNav />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
