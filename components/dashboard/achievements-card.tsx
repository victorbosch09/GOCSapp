import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Achievement } from "@/lib/achievements";

export function AchievementsCard({ achievements }: { achievements: Achievement[] }) {
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Logros</CardTitle>
        <CardDescription>
          {earnedCount}/{achievements.length} desbloqueados.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {achievements.map((a) => (
          <div
            key={a.id}
            title={a.description}
            className={`flex flex-col items-center gap-1 rounded-md border p-2 text-center ${
              a.earned ? "border-gocs-red/40 bg-primary/5" : "border-border/60 opacity-40 grayscale"
            }`}
          >
            <span className="text-2xl">{a.emoji}</span>
            <span className="text-[11px] leading-tight font-medium">{a.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
