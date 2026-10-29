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
    <div className="mx-auto max-w-4xl flex flex-col gap-8">

      {/* ── Service Card Header ── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20 shrink-0 border-2 border-primary/40">
            <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.callsign} />
            <AvatarFallback className="font-heading text-2xl bg-muted">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl">{profile.callsign}</h1>
              {profile.is_command_staff && (
                <Badge className="bg-primary/20 text-primary border-primary/30">Mando</Badge>
              )}
              {profile.is_instructor && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Instructor</Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {rank && (
                <span>
                  <span className="font-heading text-foreground font-semibold">[{rank.abbreviation}]</span>{" "}
                  {rank.name}
                </span>
              )}
              {profile.squad && <span>Escuadra {profile.squad}</span>}
              <span>Ingresó el {formatDate(profile.join_date)}</span>
              <span>{daysSince(profile.join_date)} días en el clan</span>
            </div>

            {(profile as { bio?: string | null }).bio && (
              <p className="text-sm text-muted-foreground italic">{(profile as { bio: string }).bio}</p>
            )}

            {profile.discord_username && (
              <p className="text-xs text-muted-foreground">Discord: @{profile.discord_username}</p>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[
            { label: "Contratos", value: contracts.length },
            { label: "Módulos aprobados", value: approvedModuleNumbers.length },
            { label: "Cursos especializados", value: approvedSpecialtyCourses },
            { label: "Racha asistencia", value: attendanceStreak },
          ].map((stat) => (
            <div key={stat.label} className="bg-card px-4 py-3 text-center">
              <p className="font-heading text-xl">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Achievements ── */}
      {achievements.length > 0 && (
        <section>
          <h2 className="font-heading mb-3 text-sm uppercase tracking-wide text-muted-foreground">
            Condecoraciones y Logros
          </h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a) => (
              <span
                key={a.id}
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-sm"
              >
                {a.emoji} {a.label}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── Rewards ── */}
      {rewards.length > 0 && (
        <section>
          <h2 className="font-heading mb-3 text-sm uppercase tracking-wide text-muted-foreground">
            Recompensas y Reconocimientos
          </h2>
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
          <h2 className="font-heading mb-3 text-sm uppercase tracking-wide text-muted-foreground">
            Sanciones ({sanctions.length})
          </h2>
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
        <h2 className="font-heading mb-1 text-sm uppercase tracking-wide text-muted-foreground">
          Carrera — Módulos y Cursos
        </h2>
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
        <h2 className="font-heading mb-3 text-sm uppercase tracking-wide text-muted-foreground">
          Progresión de Rango
        </h2>
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
