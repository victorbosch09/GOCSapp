import type { Metadata } from "next";
import { getAllEventsAdmin } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EventAdmin } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Calendario — Mando G.O.C.S." };

export default async function AdminCalendarioPage() {
  const events = await getAllEventsAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Calendario</h1>
        <p className="text-muted-foreground">Entrenamientos, operaciones y fechas de pago.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Gestión de eventos</CardTitle>
          <CardDescription>Visible en tiempo real para todos los aprobados.</CardDescription>
        </CardHeader>
        <CardContent>
          <EventAdmin events={events} />
        </CardContent>
      </Card>
    </div>
  );
}
