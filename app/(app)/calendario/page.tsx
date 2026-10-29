import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import { getUpcomingEvents } from "@/lib/data/events";
import { getOperatorsForSelect } from "@/lib/actions/events";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CreateEventForm } from "@/components/calendar/create-event-form";

export const metadata: Metadata = { title: "Calendario — G.O.C.S." };

export default async function CalendarioPage() {
  const profile = await getCurrentProfile();
  const [events, instructors] = await Promise.all([
    getUpcomingEvents(),
    profile.is_command_staff ? getOperatorsForSelect() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border border-white/8 p-6 flex items-start justify-between gap-4"
        style={{ background: "linear-gradient(135deg, oklch(0.16 0.006 240), oklch(0.13 0.004 240) 70%, oklch(0.50 0.15 270 / 12%) 100%)" }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-widest text-purple-400 mb-1">G.O.C.S. · Agenda Operacional</p>
          <h1 className="font-heading text-3xl">Calendario</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Entrenamientos, operaciones y actividades del clan.</p>
        </div>
        {profile.is_command_staff && <CreateEventForm instructors={instructors} />}
      </div>

      <CalendarGrid
        initialEvents={events as unknown as Parameters<typeof CalendarGrid>[0]["initialEvents"]}
        currentUserId={profile.id}
        isCommandStaff={profile.is_command_staff}
      />
    </div>
  );
}
