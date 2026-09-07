import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import {
  getOwnTransactions,
  getOwnContracts,
  getOwnNotifications,
  getOwnInventory,
} from "@/lib/data/dashboard";
import { getRanks } from "@/lib/data/admin";
import { getOwnQuizAttempts } from "@/lib/data/quiz";
import { getOwnEvaluations } from "@/lib/data/training";
import { nextPaymentDate, formatCredits, formatDate, rankLabel, daysSince } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { InventoryCard } from "@/components/dashboard/inventory-card";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { TacticalTipCard } from "@/components/dashboard/tactical-tip-card";
import { OnboardingModal } from "@/components/dashboard/onboarding-modal";
import { UpcomingEventsCard } from "@/components/dashboard/upcoming-events-card";
import { NotificationCard } from "@/components/dashboard/notification-card";
import { NextRankCard } from "@/components/dashboard/next-rank-card";
import { ActivityFeedCard, type ActivityItem } from "@/components/dashboard/activity-feed-card";
import { getUpcomingEventsForDashboard, getOwnAttendanceStreak } from "@/lib/data/attendance";
import { computeAchievements } from "@/lib/achievements";
import { AchievementsCard } from "@/components/dashboard/achievements-card";

export const metadata: Metadata = { title: "Portal — G.O.C.S." };

const TXN_BADGE: Record<string, string> = {
  Sueldo: "bg-emerald-500/15 text-emerald-400",
  Bono: "bg-emerald-500/15 text-emerald-400",
  "Compra Armamento": "bg-primary/15 text-foreground",
  "Compra Vehiculo": "bg-primary/15 text-foreground",
  "Venta Armamento": "bg-emerald-500/15 text-emerald-400",
  "Venta Vehiculo": "bg-emerald-500/15 text-emerald-400",
  Descuento: "bg-destructive/15 text-destructive",
  Sancion: "bg-destructive/15 text-destructive",
  "Ajuste Manual": "bg-muted text-muted-foreground",
};

export default async function DashboardPage() {
  const [
    profile,
    transactions,
    contracts,
    notifications,
    inventory,
    upcomingEvents,
    ranks,
    quizAttempts,
    evaluations,
    attendanceStreak,
  ] = await Promise.all([
    getCurrentProfile(),
    getOwnTransactions(),
    getOwnContracts(),
    getOwnNotifications(),
    getOwnInventory(),
    getUpcomingEventsForDashboard(),
    getRanks(),
    getOwnQuizAttempts(),
    getOwnEvaluations(),
    getOwnAttendanceStreak(),
  ]);

  const activity: ActivityItem[] = [
    ...transactions
      .filter((t) => t.type === "Compra Armamento" || t.type === "Compra Vehiculo")
      .map((t) => ({ id: `txn-${t.id}`, kind: "compra" as const, label: t.detail ?? t.type, at: t.created_at })),
    ...contracts.map((c) => ({
      id: `contract-${c.id}`,
      kind: "contrato" as const,
      label: c.risk_level ? `Contrato — nivel ${c.risk_level}` : "Contrato",
      at: c.created_at,
    })),
    ...quizAttempts.map((q) => ({
      id: `quiz-${q.id}`,
      kind: "quiz" as const,
      label: `${q.quiz?.title ?? "Quiz"} — ${q.score}/${q.total}`,
      at: q.completed_at,
    })),
    ...evaluations.map((e) => ({
      id: `eval-${e.id}`,
      kind: "evaluacion" as const,
      label: e.skill?.name ?? "Evaluación",
      at: e.evaluated_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 5);

  const achievements = computeAchievements({
    joinDate: profile.join_date,
    isCommandStaff: profile.is_command_staff,
    isInstructor: profile.is_instructor,
    quizAttempts: quizAttempts.map((q) => ({ score: q.score, total: q.total })),
    attendanceStreak,
    contractsCount: contracts.length,
    inventoryCount: inventory.length,
  });

  return (
    <div className="flex flex-col gap-6">
      {!profile.onboarded && <OnboardingModal />}
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.callsign} />}
          <AvatarFallback>{profile.callsign.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-heading text-2xl">Portal de operador</h1>
          <p className="text-muted-foreground">
            {profile.callsign}
            {profile.squad ? ` · Escuadra ${profile.squad}` : ""}
          </p>
        </div>
      </div>

      <TacticalTipCard />

      <UpcomingEventsCard events={upcomingEvents} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rango</CardDescription>
            <CardTitle className="font-heading text-lg">{rankLabel(profile)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sueldo semanal</CardDescription>
            <CardTitle className="font-heading text-lg">
              {formatCredits(profile.rank?.weekly_wage ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo actual</CardDescription>
            <CardTitle className="font-heading text-lg text-gocs-red">
              {formatCredits(profile.cached_balance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximo pago</CardDescription>
            <CardTitle className="font-heading text-lg">
              {formatDate(nextPaymentDate())}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Antigüedad</CardDescription>
            <CardTitle className="font-heading text-lg">{daysSince(profile.join_date)} días</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Racha de asistencia</CardDescription>
            <CardTitle className="font-heading text-lg">
              {attendanceStreak > 0 ? `${attendanceStreak} eventos seguidos` : "Sin racha activa"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <NextRankCard currentRank={profile.rank} ranks={ranks} />
        <ActivityFeedCard items={activity} />
      </div>

      <AchievementsCard achievements={achievements} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Movimientos recientes</CardTitle>
            <CardDescription>Sueldos, bonos, compras y descuentos.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no tenés movimientos.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Detalle</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(t.created_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={TXN_BADGE[t.type] ?? ""} variant="secondary">
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{t.detail ?? "—"}</TableCell>
                      <TableCell
                        className={`text-right font-medium tabular-nums ${
                          t.amount >= 0 ? "text-emerald-400" : "text-destructive"
                        }`}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {formatCredits(t.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <NotificationCard notifications={notifications} />
      </div>

      <InventoryCard items={inventory} />

      <ProfileCard bio={profile.bio} avatarUrl={profile.avatar_url} discordUsername={profile.discord_username} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Historial de contratos</CardTitle>
          <CardDescription>Bonos ganados por contrato.</CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no participaste de contratos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nivel de riesgo</TableHead>
                  <TableHead>Bonos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(c.contract_date)}
                    </TableCell>
                    <TableCell>{c.risk_level ? `Nivel ${c.risk_level}` : "—"}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(c.bonuses) && c.bonuses.length > 0 ? (
                          (c.bonuses as string[]).map((b) => (
                            <Badge key={b} variant="secondary">
                              {b}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-emerald-400">
                      +{formatCredits(c.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
