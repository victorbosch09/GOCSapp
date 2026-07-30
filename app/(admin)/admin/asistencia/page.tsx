import type { Metadata } from "next";
import { getAttendanceBoard } from "@/lib/data/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AttendanceMarker } from "@/components/admin/attendance-marker";

export const metadata: Metadata = { title: "Asistencia — Mando G.O.C.S." };

export default async function AdminAsistenciaPage() {
  const board = await getAttendanceBoard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Asistencia</h1>
        <p className="text-muted-foreground">
          Marcá quién estuvo realmente presente en cada entrenamiento u operación.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Cargar asistencia real</CardTitle>
          <CardDescription>
            Se usa para condicionar el sueldo semanal (menos del 50% = sin sueldo esa semana).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceMarker
            events={board.events}
            rsvps={board.rsvps}
            attendance={board.attendance}
            roster={board.roster}
          />
        </CardContent>
      </Card>
    </div>
  );
}
