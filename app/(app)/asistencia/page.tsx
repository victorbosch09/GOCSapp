import type { Metadata } from "next";
import { getAttendanceBoard } from "@/lib/data/attendance";
import { getCurrentProfile } from "@/lib/data/profile";
import { AttendanceBoard } from "@/components/attendance/attendance-board";

export const metadata: Metadata = { title: "Asistencia — G.O.C.S." };

export default async function AsistenciaPage() {
  const [profile, board] = await Promise.all([getCurrentProfile(), getAttendanceBoard()]);

  return (
    <div className="flex flex-col gap-6">
      <div
        className="relative overflow-hidden rounded-xl border border-white/8 p-6"
        style={{ background: "linear-gradient(135deg, oklch(0.16 0.006 240), oklch(0.13 0.004 240) 70%, oklch(0.55 0.16 145 / 10%) 100%)" }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 h-36 w-36 rounded-full bg-emerald-500/8 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">G.O.C.S. · Control de Presencia</p>
          <h1 className="font-heading text-3xl">Asistencia</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            El mando registra la asistencia real tras cada actividad.
            Menos del 50% de asistencia semanal = sueldo retenido.
          </p>
        </div>
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
