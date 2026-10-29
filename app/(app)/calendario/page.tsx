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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">Calendario Operacional</h1>
          <p className="text-muted-foreground">
            Entrenamientos, operaciones y actividades programadas del clan.
          </p>
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
