import { requireInstructorOrStaff } from "@/lib/data/profile";
import { AppNav } from "@/components/app-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { RealtimeListener } from "@/components/realtime-listener";
import { CommandPalette } from "@/components/command-palette";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireInstructorOrStaff();

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
      <AppNav isCommandStaff={profile.is_command_staff} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 lg:flex-row">
        <AdminNav instructorOnly={!profile.is_command_staff} />
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
