"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addSkillEvaluation, removeSkillEvaluation } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";

type Skill = { id: string; name: string; category: string | null };
type Evaluation = {
  id: string;
  skill_id: string;
  result: string;
  source: string;
  notes: string | null;
  evaluated_at: string;
  skill: { name: string; category: string | null } | null;
};

const RESULT_BADGE: Record<string, string> = {
  aprobado: "bg-emerald-500/15 text-emerald-400",
  no_aprobado: "bg-destructive/15 text-destructive",
  en_progreso: "bg-amber-500/15 text-amber-400",
};
const RESULT_LABEL: Record<string, string> = {
  aprobado: "Aprobado",
  no_aprobado: "No aprobado",
  en_progreso: "En progreso",
};

export function SkillEvalPanel({
  profileId,
  allSkills,
  evaluations: initialEvals,
}: {
  profileId: string;
  allSkills: Skill[];
  evaluations: Evaluation[];
}) {
  const [isPending, startTransition] = useTransition();
  const [skillId, setSkillId] = useState("");
  const [result, setResult] = useState<"aprobado" | "no_aprobado" | "en_progreso">("aprobado");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleAdd() {
    if (!skillId) { setError("Seleccioná un módulo o curso."); return; }
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await addSkillEvaluation({ profileId, skillId, result, notes });
      if (res.error) { setError(res.error); }
      else { setSuccess(true); setSkillId(""); setNotes(""); }
    });
  }

  function handleRemove(evalId: string) {
    startTransition(async () => {
      await removeSkillEvaluation(evalId, profileId);
    });
  }

  const grouped = allSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category ?? "Otro";
    (acc[cat] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4">
      {/* Add form */}
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold">Registrar aprobación / evaluación</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={skillId} onValueChange={setSkillId}>
            <SelectTrigger><SelectValue placeholder="Módulo o curso…" /></SelectTrigger>
            <SelectContent>
              {Object.entries(grouped).map(([cat, skills]) => (
                <div key={cat}>
                  <p className="px-2 py-1 text-xs text-muted-foreground font-medium">{cat}</p>
                  {skills.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          <Select value={result} onValueChange={(v) => setResult(v as typeof result)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="en_progreso">En progreso</SelectItem>
              <SelectItem value="no_aprobado">No aprobado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder="Notas opcionales (ej: aprobado con distinción, segunda evaluación…)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="resize-none"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {success && <p className="text-xs text-emerald-400">✓ Evaluación registrada.</p>}
        <Button size="sm" onClick={handleAdd} disabled={isPending}>
          {isPending ? "Guardando…" : "Registrar evaluación"}
        </Button>
      </div>

      {/* Existing instructor evaluations */}
      {initialEvals.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Evaluaciones de instructores ({initialEvals.length})
          </p>
          {initialEvals.map((ev) => (
            <div
              key={ev.id}
              className="flex items-start gap-2 rounded-md border border-border/40 p-2.5 text-sm"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{ev.skill?.name ?? ev.skill_id}</span>
                  <Badge className={RESULT_BADGE[ev.result] ?? ""} variant="secondary">
                    {RESULT_LABEL[ev.result] ?? ev.result}
                  </Badge>
                  {ev.source === "bot" && (
                    <Badge variant="outline" className="text-[10px]">bot</Badge>
                  )}
                </div>
                {ev.notes && <p className="mt-0.5 text-xs text-muted-foreground">{ev.notes}</p>}
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDateTime(ev.evaluated_at)}</p>
              </div>
              <button
                onClick={() => handleRemove(ev.id)}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                title="Eliminar evaluación"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
