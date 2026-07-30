import type { Metadata } from "next";
import { getUpcomingEvents } from "@/lib/data/events";
import { EventList } from "@/components/calendar/event-list";

export const metadata: Metadata = { title: "Calendario — G.O.C.S." };

export default async function CalendarioPage() {
  const events = await getUpcomingEvents();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Calendario</h1>
        <p className="text-muted-foreground">Entrenamientos, operaciones y fechas de pago.</p>
      </div>
      <EventList initial={events} />
    </div>
  );
}
