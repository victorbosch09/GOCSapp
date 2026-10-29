import type { Metadata } from "next";
import { getAllEventsAdmin } from "@/lib/data/admin";
import { getOperatorsForSelect } from "@/lib/actions/events";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EventAdmin } from "@/components/admin/event-form";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CreateEventForm } from "@/components/calendar/create-event-form";

export const metadata: Metadata = { title: "Calendario — Mando G.O.C.S." };

export default async function AdminCalendarioPage() {
  const [events, instructors] = await Promise.all([
    getAllEventsAdmin(),
    getOperatorsForSelect(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl">Calendario</h1>
          <p className="text-muted-foreground">Entrenamientos, operaciones y fechas de pago.</p>
        </div>
        <CreateEventForm instructors={instructors} />
      </div>

      {/* Vista calendario igual que la de los soldados */}
      <CalendarGrid
        initialEvents={events as unknown as Parameters<typeof CalendarGrid>[0]["initialEvents"]}
        currentUserId=""
        isCommandStaff={true}
      />

      {/* Tabla CRUD completa para mando */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Gestión de eventos</CardTitle>
          <CardDescription>Editar y eliminar eventos existentes.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventAdmin events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
