import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import { getOwnEvaluations, getOwnTrainingStats } from "@/lib/data/training";
import { getOwnQuizAttempts } from "@/lib/data/quiz";
import { getOwnAttendanceStreak } from "@/lib/data/attendance";
import { getOwnContracts, getOwnInventory } from "@/lib/data/dashboard";
import { computeAchievements } from "@/lib/achievements";
import { formatDate, formatDateTime, daysSince, rankLabel } from "@/lib/format";
import { PrintButton } from "@/components/training/print-button";

export const metadata: Metadata = { title: "Hoja de vida — G.O.C.S." };

const RESULT_LABEL: Record<string, string> = {
  aprobado: "Aprobado",
  no_aprobado: "No aprobado",
  en_progreso: "En progreso",
};

export default async function HojaDeVidaPage() {
  const [profile, evaluations, stats, quizAttempts, attendanceStreak, contracts, inventory] = await Promise.all([
    getCurrentProfile(),
    getOwnEvaluations(),
    getOwnTrainingStats(),
    getOwnQuizAttempts(),
    getOwnAttendanceStreak(),
    getOwnContracts(),
    getOwnInventory(),
  ]);

  const achievements = computeAchievements({
    joinDate: profile.join_date,
    isCommandStaff: profile.is_command_staff,
    isInstructor: profile.is_instructor,
    quizAttempts: quizAttempts.map((q) => ({ score: q.score, total: q.total })),
    attendanceStreak,
    contractsCount: contracts.length,
    inventoryCount: inventory.length,
  }).filter((a) => a.earned);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 print-sheet">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted-foreground">
          Vista imprimible. Usá el botón para guardarla como PDF (el diálogo de impresión del
          navegador tiene la opción &quot;Guardar como PDF&quot;).
        </p>
        <PrintButton />
      </div>

      <div className="border-b border-border/60 pb-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">G.O.C.S. — Hoja de vida</p>
        <h1 className="font-heading text-2xl">{profile.callsign}</h1>
        <p className="text-sm text-muted-foreground">
          {rankLabel(profile)} {profile.squad ? `· Escuadra ${profile.squad}` : ""} · Ingresó el{" "}
          {formatDate(profile.join_date)} ({daysSince(profile.join_date)} días en el clan)
        </p>
      </div>

      <section>
        <h2 className="font-heading mb-2 text-sm text-muted-foreground">Resumen de entrenamiento</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border border-border/60 p-3 text-center">
            <p className="font-heading text-xl">{stats.modulesAprobados}</p>
            <p className="text-xs text-muted-foreground">Módulos aprobados</p>
          </div>
          <div className="rounded-md border border-border/60 p-3 text-center">
            <p className="font-heading text-xl">{stats.quizzesAttempted}</p>
            <p className="text-xs text-muted-foreground">Quizzes rendidos</p>
          </div>
          <div className="rounded-md border border-border/60 p-3 text-center">
            <p className="font-heading text-xl">{stats.avgScorePct}%</p>
            <p className="text-xs text-muted-foreground">Puntaje promedio</p>
          </div>
          <div className="rounded-md border border-border/60 p-3 text-center">
            <p className="font-heading text-xl">{attendanceStreak}</p>
            <p className="text-xs text-muted-foreground">Racha de asistencia</p>
          </div>
        </div>
      </section>

      {achievements.length > 0 && (
        <section>
          <h2 className="font-heading mb-2 text-sm text-muted-foreground">Logros</h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span key={a.id} className="rounded-full border border-border/60 px-3 py-1 text-xs">
                {a.emoji} {a.label}
              </span>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-heading mb-2 text-sm text-muted-foreground">Evaluaciones</h2>
        {evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin evaluaciones cargadas todavía.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-1.5 pr-2 font-normal">Módulo</th>
                <th className="py-1.5 pr-2 font-normal">Resultado</th>
                <th className="py-1.5 pr-2 font-normal">Puntaje</th>
                <th className="py-1.5 font-normal">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e) => (
                <tr key={e.id} className="border-b border-border/40">
                  <td className="py-1.5 pr-2">
                    {(e as unknown as { skill?: { name: string } }).skill?.name ?? "—"}
                  </td>
                  <td className="py-1.5 pr-2">{RESULT_LABEL[e.result] ?? e.result}</td>
                  <td className="py-1.5 pr-2">{e.score ?? "—"}</td>
                  <td className="py-1.5">{formatDate(e.evaluated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 className="font-heading mb-2 text-sm text-muted-foreground">Historial de quizzes</h2>
        {quizAttempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin quizzes rendidos todavía.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-1.5 pr-2 font-normal">Quiz</th>
                <th className="py-1.5 pr-2 font-normal">Puntaje</th>
                <th className="py-1.5 font-normal">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {quizAttempts.map((a) => (
                <tr key={a.id} className="border-b border-border/40">
                  <td className="py-1.5 pr-2">{a.quiz?.title ?? "Quiz"}</td>
                  <td className="py-1.5 pr-2">
                    {a.score}/{a.total}
                  </td>
                  <td className="py-1.5">{formatDateTime(a.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-xs text-muted-foreground print:mt-8">
        Generado el {formatDateTime(new Date().toISOString())} — G.O.C.S., Grupo Operacional Comando Sur.
      </p>
    </div>
  );
}
