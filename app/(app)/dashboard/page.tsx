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
import { getUpcomingEventsForDashboard, getOwnAttendanceStreak, getOwnAttendanceHistory } from "@/lib/data/attendance";
import { computeAchievements } from "@/lib/achievements";
import { AchievementsCard } from "@/components/dashboard/achievements-card";
import { AttendanceHeatmap } from "@/components/dashboard/attendance-heatmap";
import { DailyRewardButton } from "@/components/dashboard/daily-reward-button";

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
    attendanceHistory,
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
    getOwnAttendanceHistory(),
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

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-col gap-5">
      {!profile.onboarded && <OnboardingModal />}

      {/* ── HERO BANNER ── */}
      <div
        className="relative overflow-hidden rounded-xl border border-white/8"
        style={{ background: "linear-gradient(135deg, oklch(0.16 0.006 240) 0%, oklch(0.13 0.004 240) 60%, oklch(0.52 0.20 25 / 12%) 100%)" }}
      >
        {/* red glow top-right */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 p-5 sm:p-7">
          {/* identity row */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/50 shadow-[0_0_16px_oklch(0.52_0.20_25/30%)]">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.callsign} />}
              <AvatarFallback className="font-heading text-xl bg-muted">{profile.callsign.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl sm:text-3xl leading-none">{profile.callsign}</h1>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">
                {rankLabel(profile)}{profile.squad ? ` · ESCUADRA ${profile.squad}` : ""}
              </p>
            </div>
          </div>

          {/* big stats row */}
          <div className="grid grid-cols-3 divide-x divide-white/8 rounded-lg border border-white/8 bg-black/20">
            <div className="flex flex-col items-center py-3 px-2 gap-0.5">
              <p className="font-heading text-xl sm:text-2xl text-gocs-red tabular-nums">{formatCredits(profile.cached_balance)}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Saldo</p>
            </div>
            <div className="flex flex-col items-center py-3 px-2 gap-0.5">
              <p className="font-heading text-xl sm:text-2xl tabular-nums">{daysSince(profile.join_date)}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Días activo</p>
            </div>
            <div className="flex flex-col items-center py-3 px-2 gap-0.5">
              <p className="font-heading text-xl sm:text-2xl tabular-nums text-amber-400">{profile.login_streak ?? 0}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Racha</p>
            </div>
          </div>

          {/* daily reward + next pay */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DailyRewardButton
              alreadyClaimed={profile.last_login_date === todayStr}
              currentStreak={profile.login_streak ?? 0}
            />
            <p className="text-xs text-muted-foreground">
              Pago: <span className="text-foreground font-medium">{formatDate(nextPaymentDate())}</span>
              {" · "}
              <span className="text-emerald-400 font-medium">{formatCredits(profile.rank?.weekly_wage ?? 0)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── QUICK-ACCESS GRID ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/entrenamiento", label: "Training",   sub: "Quizzes y módulos",  color: "from-blue-500/10",   dot: "bg-blue-500"    },
          { href: "/tienda",        label: "Tienda",     sub: "Armamento y vehículos", color: "from-amber-500/10",  dot: "bg-amber-400"   },
          { href: "/equipo",        label: "Equipo",     sub: "Escalafón del clan", color: "from-emerald-500/10",dot: "bg-emerald-500" },
          { href: "/manual",        label: "Manual",     sub: "Reglamento V2",      color: "from-purple-500/10", dot: "bg-purple-500"  },
        ].map((q) => (
          <a
            key={q.href}
            href={q.href}
            className={`group relative overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br ${q.color} to-transparent p-4 flex flex-col gap-2 hover:border-white/15 transition-colors`}
          >
            <span className={`h-2 w-2 rounded-full ${q.dot}`} />
            <p className="font-heading text-sm leading-none">{q.label}</p>
            <p className="text-[11px] text-muted-foreground">{q.sub}</p>
          </a>
        ))}
      </div>

      <TacticalTipCard />
      <UpcomingEventsCard events={upcomingEvents} />

      <div className="grid gap-5 lg:grid-cols-2">
        <NextRankCard currentRank={profile.rank} ranks={ranks} />
        <ActivityFeedCard items={activity} />
      </div>

      <AchievementsCard achievements={achievements} />
      <AttendanceHeatmap history={attendanceHistory} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 card-tactical overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="font-heading text-sm">Movimientos recientes</p>
            <Badge variant="secondary" className="text-xs">{transactions.length}</Badge>
          </div>
          {transactions.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Sin movimientos todavía.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Detalle</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{formatDate(t.created_at)}</TableCell>
                    <TableCell>
                      <Badge className={TXN_BADGE[t.type] ?? ""} variant="secondary">{t.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground hidden sm:table-cell">{t.detail ?? "—"}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums text-sm ${t.amount >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                      {t.amount >= 0 ? "+" : ""}{formatCredits(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
        <NotificationCard notifications={notifications} />
      </div>

      <InventoryCard items={inventory} />
      <ProfileCard bio={profile.bio} avatarUrl={profile.avatar_url} discordUsername={profile.discord_username} callsign={profile.callsign} profileId={profile.id} />

      {contracts.length > 0 && (
        <div className="card-tactical overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
            <p className="font-heading text-sm">Historial de contratos</p>
            <Badge variant="secondary" className="text-xs">{contracts.length}</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead className="hidden sm:table-cell">Bonos</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-xs">{formatDate(c.contract_date)}</TableCell>
                  <TableCell>{c.risk_level ? `Niv. ${c.risk_level}` : "—"}</TableCell>
                  <TableCell className="max-w-[220px] hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(c.bonuses) && c.bonuses.length > 0 ? (
                        (c.bonuses as string[]).map((b) => <Badge key={b} variant="secondary">{b}</Badge>)
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-emerald-400">+{formatCredits(c.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
