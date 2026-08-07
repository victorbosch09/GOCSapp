import { formatCredits } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Rank } from "@/types/database";

export function NextRankCard({
  currentRank,
  ranks,
}: {
  currentRank: Rank | null;
  ranks: Rank[];
}) {
  const sorted = [...ranks].sort((a, b) => a.sort_order - b.sort_order);
  const nextRank = currentRank
    ? sorted.find((r) => r.sort_order > currentRank.sort_order)
    : sorted[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Próximo rango</CardTitle>
        {nextRank && <CardDescription>Sueldo semanal: {formatCredits(nextRank.weekly_wage)}</CardDescription>}
      </CardHeader>
      <CardContent>
        {nextRank ? (
          <>
            <p className="font-heading text-lg">
              {nextRank.name} ({nextRank.abbreviation})
            </p>
            {nextRank.promotion_requirement && (
              <p className="mt-1 text-sm text-muted-foreground">{nextRank.promotion_requirement}</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Ya alcanzaste el rango más alto del escalafón.</p>
        )}
      </CardContent>
    </Card>
  );
}
