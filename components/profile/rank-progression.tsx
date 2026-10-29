"use client";

import { cn } from "@/lib/utils";
import type { Rank, RankRequirements } from "@/types/database";

type Props = {
  allRanks: Rank[];
  currentRankId: string | null;
  contractsCount: number;
  approvedModuleNumbers: number[];
  approvedSpecialtyCourses: number;
  approvedLeadershipCourses: string[];
};

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn("h-1.5 rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function RankProgression({
  allRanks,
  currentRankId,
  contractsCount,
  approvedModuleNumbers,
  approvedSpecialtyCourses,
  approvedLeadershipCourses,
}: Props) {
  const currentIdx = allRanks.findIndex((r) => r.id === currentRankId);
  const nextRank = currentIdx >= 0 && currentIdx < allRanks.length - 1
    ? allRanks[currentIdx + 1]
    : null;

  const reqs: RankRequirements | null = nextRank?.requirements_json ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Rank ladder */}
      <div className="flex flex-col gap-0">
        {allRanks.map((rank, idx) => {
          const isCurrent = rank.id === currentRankId;
          const isPast = currentIdx >= 0 && idx < currentIdx;
          const isFuture = currentIdx >= 0 && idx > currentIdx;

          return (
            <div key={rank.id} className="flex gap-3">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all",
                    isCurrent
                      ? "border-primary bg-primary text-primary-foreground scale-110"
                      : isPast
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-border bg-muted/30 text-muted-foreground"
                  )}
                >
                  {isPast ? "✓" : rank.sort_order}
                </div>
                {idx < allRanks.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 min-h-[24px]",
                      isPast || isCurrent ? "bg-primary/40" : "bg-border/40"
                    )}
                  />
                )}
              </div>

              {/* Rank info */}
              <div
                className={cn(
                  "mb-1 flex-1 rounded-lg border p-3 transition-all",
                  isCurrent
                    ? "border-primary/60 bg-primary/5"
                    : isPast
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-border/40 bg-muted/10 opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-heading text-xs font-bold px-1.5 py-0.5 rounded",
                        isCurrent
                          ? "bg-primary/20 text-primary"
                          : isPast
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      [{rank.abbreviation}]
                    </span>
                    <span className={cn("font-medium text-sm", isFuture && "text-muted-foreground")}>
                      {rank.name}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                        Tu rango
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ${rank.weekly_wage.toLocaleString()}/sem
                  </span>
                </div>
                {isCurrent && rank.promotion_requirement && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Requisito siguiente: {rank.promotion_requirement}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next rank progress bars */}
      {nextRank && reqs && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3">
          <p className="font-heading text-sm font-semibold">
            Progreso hacia [{nextRank.abbreviation}] {nextRank.name}
          </p>

          {reqs.contracts && (
            <ProgressBar
              label="Contratos completados"
              value={contractsCount}
              max={reqs.contracts}
            />
          )}

          {reqs.modules && reqs.modules.length > 0 && (
            <ProgressBar
              label={`Módulos requeridos (${reqs.modules.map((m) => `Mod ${m}`).join(", ")})`}
              value={reqs.modules.filter((m) => approvedModuleNumbers.includes(m)).length}
              max={reqs.modules.length}
            />
          )}

          {reqs.specialty_courses && reqs.specialty_courses > 0 && (
            <ProgressBar
              label="Cursos de rol especializado"
              value={approvedSpecialtyCourses}
              max={reqs.specialty_courses}
            />
          )}

          {reqs.leadership_course && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{reqs.leadership_course}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  approvedLeadershipCourses.includes(reqs.leadership_course)
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {approvedLeadershipCourses.includes(reqs.leadership_course) ? "✓ Completado" : "Pendiente"}
              </span>
            </div>
          )}

          {reqs.requires_vote && (
            <p className="text-xs text-amber-400">
              ⚠️ Este ascenso también requiere votación grupal del mando.
            </p>
          )}
        </div>
      )}

      {!nextRank && currentRankId && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Has alcanzado el rango máximo de la escala operativa.
        </p>
      )}
    </div>
  );
}
