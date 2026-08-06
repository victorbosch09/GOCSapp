import type { Metadata } from "next";
import { getAttendanceBoard } from "@/lib/data/attendance";
import { getCurrentProfile } from "@/lib/data/profile";
import { AttendanceBoard } from "@/components/attendance/attendance-board";

export const metadata: Metadata = { title: "Asistencia — G.O.C.S." };

export default async function AsistenciaPage() {
  const [profile, board] = await Promise.all([getCurrentProfile(), getAttendanceBoard()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Asistencia</h1>
        <p className="text-muted-foreground">
          Avisá tu asistencia por Discord — el mando la carga acá. La asistencia real, registrada
          después de cada actividad, condiciona el sueldo semanal (menos del 50% de asistencia esa
          semana = sin sueldo).
        </p>
      </div>
      <AttendanceBoard
        events={board.events}
        rsvps={board.rsvps}
        attendance={board.attendance}
        roster={board.roster}
        currentProfileId={profile.id}
      />
    </div>
  );
}
