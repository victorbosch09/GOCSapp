import { Card, CardContent } from "@/components/ui/card";
import { formatCredits } from "@/lib/format";
import type { OwnTrainingStats } from "@/lib/data/training";

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "red" | "emerald" | "amber";
}) {
  const color =
    accent === "red"
      ? "text-gocs-red"
      : accent === "emerald"
        ? "text-emerald-400"
        : accent === "amber"
          ? "text-amber-400"
          : "text-foreground";
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-border/60 bg-primary/5 px-3 py-4 text-center">
      <span className={`font-heading text-3xl ${color}`}>{value}</span>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

export function TrainingStatsCard({ stats }: { stats: OwnTrainingStats }) {
  return (
    <Card className="overflow-hidden border-gocs-red/30">
      <div className="border-b border-gocs-red/30 bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-4">
        <p className="font-heading text-lg tracking-wide">📊 Mis estadísticas</p>
        <p className="text-sm text-muted-foreground">Tu hoja de servicio en entrenamiento.</p>
      </div>
      <CardContent className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Quizzes hechos" value={stats.quizzesAttempted} />
        <Stat label="Quizzes aprobados" value={stats.quizzesPassed} accent="emerald" />
        <Stat label="Promedio" value={`${stats.avgScorePct}%`} accent="amber" />
        <Stat label="Créditos por quizzes" value={formatCredits(stats.totalQuizCredits)} accent="red" />
        <Stat label="Módulos aprobados" value={stats.modulesAprobados} accent="emerald" />
        <Stat label="Módulos en curso" value={stats.modulesEnProgreso} accent="amber" />
      </CardContent>
    </Card>
  );
}
