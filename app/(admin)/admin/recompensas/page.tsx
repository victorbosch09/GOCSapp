import type { Metadata } from "next";
import { getAllProfiles, getRecentRewards } from "@/lib/data/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RewardForm } from "@/components/admin/reward-form";

export const metadata: Metadata = { title: "Recompensas — Mando G.O.C.S." };

export default async function AdminRecompensasPage() {
  const [profiles, rewards] = await Promise.all([getAllProfiles(), getRecentRewards()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Recompensas</h1>
        <p className="text-muted-foreground">Reconocimientos manuales, con o sin créditos.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Nueva recompensa</CardTitle>
        </CardHeader>
        <CardContent>
          <RewardForm profiles={profiles.filter((p) => p.approved)} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Últimas entregadas</CardTitle>
          <CardDescription>{rewards.length} registros recientes.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin recompensas entregadas todavía.</p>
          ) : (
            rewards.map((r) => (
              <div key={r.id} className="rounded-md border border-border/60 p-3 text-sm">
                <p className="font-medium">
                  {r.title}
                  {r.amount ? ` · ${formatCredits(r.amount)}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {(r as unknown as { profile?: { callsign: string } }).profile?.callsign} ·{" "}
                  {formatDateTime(r.awarded_at)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
