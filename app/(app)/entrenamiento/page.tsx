import type { Metadata } from "next";
import { getOwnEvaluations, getTrainingMaterials, getOwnTrainingStats } from "@/lib/data/training";
import { getQuizzes, getOwnQuizAttempts, getQuizLeaderboard } from "@/lib/data/quiz";
import { formatDate, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuizList } from "@/components/training/quiz-player";
import { TrainingStatsCard } from "@/components/training/stats-card";
import { LeaderboardCard } from "@/components/training/leaderboard-card";
import { MaterialsList } from "@/components/training/materials-list";

export const metadata: Metadata = { title: "Entrenamiento — G.O.C.S." };

const RESULT_LABEL: Record<string, string> = {
  aprobado: "Aprobado",
  no_aprobado: "No aprobado",
  en_progreso: "En progreso",
};

const RESULT_BADGE: Record<string, string> = {
  aprobado: "bg-emerald-500/15 text-emerald-400",
  no_aprobado: "bg-destructive/15 text-destructive",
  en_progreso: "bg-amber-500/15 text-amber-400",
};

export default async function EntrenamientoPage() {
  const [stats, evaluations, materials, quizzes, attempts, leaderboard] = await Promise.all([
    getOwnTrainingStats(),
    getOwnEvaluations(),
    getTrainingMaterials(),
    getQuizzes(),
    getOwnQuizAttempts(),
    getQuizLeaderboard(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Entrenamiento</h1>
        <p className="text-muted-foreground">
          Tu hoja de vida, tus quizzes y la biblioteca de material de estudio del clan.
        </p>
      </div>

      <TrainingStatsCard stats={stats} />

      <LeaderboardCard entries={leaderboard} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">🎯 Quizzes disponibles</CardTitle>
            <CardDescription>
              Aprobar (≥70%) por primera vez te da un bono automático de créditos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QuizList quizzes={quizzes} attempts={attempts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">📝 Mis intentos</CardTitle>
            <CardDescription>Historial de todos tus quizzes rendidos.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no rendiste ningún quiz.</p>
            ) : (
              attempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
                >
                  <span className="font-medium">{a.quiz?.title ?? "Quiz"}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        a.score / a.total >= 0.7
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }
                      variant="secondary"
                    >
                      {a.score}/{a.total}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(a.completed_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">📖 Mi hoja de vida</CardTitle>
          <CardDescription>Evaluaciones cargadas por instructores y mando, por módulo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tenés evaluaciones cargadas.</p>
          ) : (
            evaluations.map((e) => (
              <div key={e.id} className="rounded-md border border-border/60 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {(e as unknown as { skill?: { name: string } }).skill?.name ?? "—"}
                  </span>
                  <Badge className={RESULT_BADGE[e.result]} variant="secondary">
                    {RESULT_LABEL[e.result]}
                  </Badge>
                  {e.score != null && <span className="text-muted-foreground">Puntaje: {e.score}</span>}
                </div>
                {e.notes && <p className="mt-1 text-muted-foreground">{e.notes}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.evaluated_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">📚 Material de estudio</CardTitle>
          <CardDescription>Biblioteca compartida del clan — cursos, manuales, exámenes.</CardDescription>
        </CardHeader>
        <CardContent>
          <MaterialsList materials={materials} />
        </CardContent>
      </Card>
    </div>
  );
}
