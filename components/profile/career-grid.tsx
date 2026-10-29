import { cn } from "@/lib/utils";
import type { Skill, SkillEvaluation } from "@/types/database";

type EvalWithSkill = SkillEvaluation & { skill?: Skill | null };

type Props = {
  allSkills: Skill[];
  evaluations: EvalWithSkill[];
};

const CATEGORY_ORDER = ["Modulo", "Curso especializado", "Curso de liderazgo"];
const CATEGORY_LABEL: Record<string, string> = {
  Modulo: "Módulos de Instrucción",
  "Curso especializado": "Cursos de Rol Especializado",
  "Curso de liderazgo": "Cursos de Liderazgo",
};

function StatusDot({ result }: { result: "aprobado" | "no_aprobado" | "en_progreso" | null }) {
  if (!result) return <span className="h-2.5 w-2.5 rounded-full border-2 border-border bg-muted" />;
  const styles = {
    aprobado: "bg-emerald-500",
    no_aprobado: "bg-destructive",
    en_progreso: "bg-amber-500",
  };
  return <span className={cn("h-2.5 w-2.5 rounded-full", styles[result])} />;
}

export function CareerGrid({ allSkills, evaluations }: Props) {
  // Build a map: skill_id → best instructor evaluation
  const evalMap = new Map<string, EvalWithSkill>();
  for (const ev of evaluations) {
    if (ev.source === "quiz") continue; // Exclude quiz auto-evaluations
    const existing = evalMap.get(ev.skill_id);
    // Keep aprobado over others; among same result keep most recent
    if (!existing || ev.result === "aprobado" || new Date(ev.evaluated_at) > new Date(existing.evaluated_at)) {
      evalMap.set(ev.skill_id, ev);
    }
  }

  const byCategory = new Map<string, Skill[]>();
  for (const skill of allSkills) {
    const cat = skill.category ?? "Otro";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(skill);
  }

  const categories = [
    ...CATEGORY_ORDER.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

  return (
    <div className="flex flex-col gap-6">
      {categories.map((cat) => {
        const skills = byCategory.get(cat) ?? [];
        const approved = skills.filter((s) => evalMap.get(s.id)?.result === "aprobado").length;
        return (
          <div key={cat}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-heading text-sm text-muted-foreground">
                {CATEGORY_LABEL[cat] ?? cat}
              </h3>
              <span className="text-xs text-muted-foreground">
                {approved}/{skills.length}
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => {
                const ev = evalMap.get(skill.id);
                const result = ev?.result ?? null;
                return (
                  <div
                    key={skill.id}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border p-2.5",
                      result === "aprobado"
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : result === "en_progreso"
                        ? "border-amber-500/30 bg-amber-500/5"
                        : result === "no_aprobado"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border/40 bg-muted/10"
                    )}
                  >
                    <StatusDot result={result} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug">{skill.name}</p>
                      {skill.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {skill.description}
                        </p>
                      )}
                      {ev && result === "aprobado" && (
                        <p className="mt-1 text-[10px] text-emerald-400 font-medium">✓ Aprobado</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
