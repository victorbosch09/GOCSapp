import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { QuizLeaderboardEntry } from "@/types/database";

export function LeaderboardCard({ entries }: { entries: QuizLeaderboardEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">🏆 Ranking de quizzes</CardTitle>
        <CardDescription>Top del clan por quizzes aprobados y promedio de puntaje.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía nadie rindió un quiz.</p>
        ) : (
          entries.map((e, i) => (
            <div
              key={e.profile_id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-center font-heading text-muted-foreground">{i + 1}</span>
                <span className="font-medium">{e.callsign}</span>
                {e.squad && <span className="text-xs text-muted-foreground">{e.squad}</span>}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{e.aprobados} aprobados</Badge>
                <span className="text-xs text-muted-foreground">{e.promedio_pct}% prom.</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
