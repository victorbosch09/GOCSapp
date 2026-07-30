import type { Metadata } from "next";
import { getAllProfiles, getRecentRewards } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RewardForm } from "@/components/admin/reward-form";
import { RewardList } from "@/components/admin/reward-list";

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
        <CardContent>
          <RewardList rewards={rewards} />
        </CardContent>
      </Card>
    </div>
  );
}
