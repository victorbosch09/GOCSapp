import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import { getAllBuddyTeams, getAvailableBuddyOperators, getAvailableAspirants, getBuddyStats } from "@/lib/data/buddy";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormTeamPanel } from "@/components/buddy/form-team-panel";
import { BuddyTeamCard } from "@/components/buddy/buddy-team-card";

export const metadata: Metadata = { title: "Buddy System — G.O.C.S." };

const OPERATOR_RANK_NAME = "Operador lvl1";

export default async function BuddySystemPage() {
  const [profile, teams, availableOperators, availableAspirants, stats] = await Promise.all([
    getCurrentProfile(),
    getAllBuddyTeams(),
    getAvailableBuddyOperators(),
    getAvailableAspirants(),
    getBuddyStats(),
  ]);

  const myTeam = teams.find(
    (t) => t.operator_a.id === profile.id || t.operator_b.id === profile.id
  );
  const iAmOperator = profile.rank?.name === OPERATOR_RANK_NAME;
  const otherTeams = teams.filter((t) => t.id !== myTeam?.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Buddy System</h1>
        <p className="text-muted-foreground">
          Dos Operadores lvl1 adoptan un Candidato, lo entrenan y lo preparan para ascender.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Tríos activos" value={stats.activeTeams} />
        <StatTile label="En entrenamiento" value={stats.inTraining} />
        <StatTile label="Listos para ascender" value={stats.readyToPromote} />
        <StatTile label="Graduados" value={stats.graduated} />
      </div>

      {myTeam ? (
        <div>
          <h2 className="font-heading mb-2 text-sm text-muted-foreground">Mi equipo</h2>
          <BuddyTeamCard team={myTeam} isMine availableAspirants={availableAspirants} />
        </div>
      ) : iAmOperator ? (
        <FormTeamPanel candidates={availableOperators.filter((o) => o.id !== profile.id)} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Solo para Operadores lvl1</CardTitle>
            <CardDescription>
              El Buddy System es para operadores de rango Operador lvl1. Podés ver los tríos activos
              del clan más abajo.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {otherTeams.length > 0 && (
        <div>
          <h2 className="font-heading mb-2 text-sm text-muted-foreground">Otros tríos del clan</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {otherTeams.map((t) => (
              <BuddyTeamCard key={t.id} team={t} isMine={false} availableAspirants={availableAspirants} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
