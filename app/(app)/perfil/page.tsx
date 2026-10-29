import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFullProfileData } from "@/lib/data/profile-service";
import { computeAchievements } from "@/lib/achievements";
import { getOwnAttendanceStreak } from "@/lib/data/attendance";
import { getOwnQuizAttempts } from "@/lib/data/quiz";
import { getOwnInventory } from "@/lib/data/dashboard";
import { RankProgression } from "@/components/profile/rank-progression";
import { CareerGrid } from "@/components/profile/career-grid";
import { formatDate, daysSince } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Skill, SkillEvaluation, Rank } from "@/types/database";

export const metadata: Metadata = { title: "Mi Perfil — G.O.C.S." };

const SEVERITY_COLOR: Record<string, string> = {
  leve: "bg-amber-500/15 text-amber-400",
  moderada: "bg-orange-500/15 text-orange-400",
  grave: "bg-red-500/15 text-red-400",
  "muy grave": "bg-red-700/15 text-red-600",
  extrema: "bg-destructive/15 text-destructive",
};

export default async function PerfilPage() {
  const data = await getFullProfileData();
  if (!data) redirect("/login");

  const { profile, evaluations, rewards, sanctions, contracts, allRanks, allSkills } = data;

  const [quizAttempts, attendanceStreak, inventory] = await Promise.all([
    getOwnQuizAttempts(),
    getOwnAttendanceStreak(),
    getOwnInventory(),
  ]);

  const achievements = computeAchievements({
    joinDate: profile.join_date,
    isCommandStaff: profile.is_command_staff,
    isInstructor: profile.is_instructor,
    quizAttempts: quizAttempts.map((q) => ({ score: q.score, total: q.total })),
    attendanceStreak,
    contractsCount: contracts.length,
    inventoryCount: inventory.length,
  }).filter((a) => a.earned);

  // Instructor/bot-only evaluations (exclude quiz auto-evaluations)
  const instructorEvals = evaluations.filter(
    (e) => (e as { source?: string }).source !== "quiz"
  ) as (SkillEvaluation & { skill?: Skill | null })[];

  const approvedEvalsBySkillId = new Set<string>();
  for (const ev of instructorEvals) {
    if (ev.result === "aprobado") approvedEvalsBySkillId.add(ev.skill_id);
  }

  const typedSkills = allSkills as Skill[];
  const moduleSkills = typedSkills.filter((s) => s.category === "Modulo");
  const specialtySkills = typedSkills.filter((s) => s.category === "Curso especializado");
  const leadershipSkills = typedSkills.filter((s) => s.category === "Curso de liderazgo");

  const approvedModuleNumbers: number[] = [];
  for (const skill of moduleSkills) {
    if (!approvedEvalsBySkillId.has(skill.id)) continue;
    const match = skill.name.match(/^Mod\s+(\d+)/i);
    if (match) approvedModuleNumbers.push(parseInt(match[1]));
  }

  const approvedSpecialtyCourses = specialtySkills.filter((s) => approvedEvalsBySkillId.has(s.id)).length;
  const approvedLeadershipCourses = leadershipSkills
    .filter((s) => approvedEvalsBySkillId.has(s.id))
    .map((s) => s.name);

  const rank = profile.rank as Rank | null;
  const initials = profile.callsign.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-6">

      {/* ── SERVICE RECORD HEADER ── */}
      <div
        className="relative overflow-hidden rounded-xl border border-white/8"
        style={{ background: "linear-gradient(135deg, oklch(0.16 0.006 240), oklch(0.13 0.004 240) 70%, oklch(0.52 0.20 25 / 10%) 100%)" }}
      >
        <div className="pointer-events-none absolute -top-8 -right-8 h-40 w-40 rounded-full bg-primary/8 blur-3xl" />
        <div className="relative p-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 shrink-0 border-2 border-primary/50 shadow-[0_0_20px_oklch(0.52_0.20_25/25%)]">
              <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.callsign} />
              <AvatarFallback className="font-heading text-2xl bg-muted">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {rank && <span className="font-heading text-xs text-primary uppercase tracking-widest">[{rank.abbreviation}]</span>}
                <h1 className="font-heading text-3xl">{profile.callsign}</h1>
              </div>
              <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
                {rank?.name ?? "Sin rango"}
                {profile.squad ? ` · Escuadra ${profile.squad}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.is_command_staff && <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">Alto Mando</Badge>}
                {profile.is_instructor && <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Instructor</Badge>}
                {approvedLeadershipCourses.map((c) => (
                  <Badge key={c} className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">{c}</Badge>
                ))}
              </div>
              {(profile as { bio?: string | null }).bio && (
                <p className="mt-2 text-sm text-muted-foreground/80 italic">{(profile as { bio: string }).bio}</p>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div className="mt-5 grid grid-cols-4 divide-x divide-white/8 rounded-lg border border-white/8 bg-black/20">
            {[
              { label: "Contratos", value: contracts.length },
              { label: "Módulos", value: approvedModuleNumbers.length },
              { label: "Cursos esp.", value: approvedSpecialtyCourses },
              { label: "Racha", value: attendanceStreak },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-3 px-1 gap-0.5">
                <p className="font-heading text-xl sm:text-2xl">{s.value}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center">{s.label}</p>
              </div>
            ))}
          </div>

          {profile.discord_username && (
            <p className="mt-3 text-xs text-muted-foreground">Discord: <span className="text-foreground/70">@{profile.discord_username}</span></p>
          )}
        </div>
      </div>

      {/* ── Achievements ── */}
      {achievements.length > 0 && (
        <section>
          <p className="section-header"><span className="h-1 w-3 rounded-full bg-primary shrink-0" />Condecoraciones</p>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm font-medium"
              >
                <span className="text-base">{a.emoji}</span> {a.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Rewards ── */}
      {rewards.length > 0 && (
        <section>
          <p className="section-header"><span className="h-1 w-3 rounded-full bg-emerald-500 shrink-0" />Recompensas y Reconocimientos</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(rewards as Array<{ id: string; title: string; description?: string | null; amount?: number | null }>).map((r) => (
              <div
                key={r.id}
                className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
              >
                <span className="text-lg">🏅</span>
                <div>
                  <p className="font-medium text-sm">{r.title}</p>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  )}
                  {r.amount != null && (
                    <p className="text-xs text-emerald-400 font-medium">+${r.amount.toLocaleString()} créditos</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Sanctions ── */}
      {sanctions.length > 0 && (
        <section>
          <p className="section-header"><span className="h-1 w-3 rounded-full bg-destructive shrink-0" />Sanciones ({sanctions.length})</p>
          <div className="flex flex-col gap-2">
            {(sanctions as Array<{ id: string; severity: string; description?: string | null; amount_deducted?: number | null }>).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-lg border border-border/40 p-3 text-sm"
              >
                <Badge className={SEVERITY_COLOR[s.severity] ?? "bg-muted text-muted-foreground"} variant="secondary">
                  {s.severity}
                </Badge>
                <span className="flex-1 text-muted-foreground">{s.description ?? "—"}</span>
                {s.amount_deducted != null && (
                  <span className="text-destructive text-xs font-medium">−${s.amount_deducted.toLocaleString()}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Career Grid ── */}
      <section>
        <p className="section-header"><span className="h-1 w-3 rounded-full bg-primary shrink-0" />Carrera — Módulos y Cursos</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Solo evaluaciones cargadas por instructores o mando. Los quizzes de autoevaluación no cuentan aquí.
        </p>
        <CareerGrid
          allSkills={typedSkills}
          evaluations={evaluations as (SkillEvaluation & { skill?: Skill | null })[]}
        />
      </section>

      {/* ── Rank Progression ── */}
      <section>
        <p className="section-header"><span className="h-1 w-3 rounded-full bg-primary shrink-0" />Progresión de Rango</p>
        <RankProgression
          allRanks={allRanks}
          currentRankId={profile.rank_id}
          contractsCount={contracts.length}
          approvedModuleNumbers={approvedModuleNumbers}
          approvedSpecialtyCourses={approvedSpecialtyCourses}
          approvedLeadershipCourses={approvedLeadershipCourses}
        />
      </section>

    </div>
  );
}
