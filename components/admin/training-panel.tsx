"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  createSkill,
  evaluateSkill,
  deleteEvaluation,
  addTrainingMaterial,
  deleteTrainingMaterial,
} from "@/lib/actions/training";
import { useConfirm } from "@/components/ui/confirm-provider";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Skill, SkillEvaluation, SkillResult, TrainingMaterial } from "@/types/database";

const RESULTS: { value: SkillResult; label: string }[] = [
  { value: "aprobado", label: "Aprobado" },
  { value: "no_aprobado", label: "No aprobado" },
  { value: "en_progreso", label: "En progreso" },
];

type EvaluationRow = SkillEvaluation & {
  skill?: { name: string } | null;
  profile?: { callsign: string } | null;
};

type RosterEntry = { id: string; callsign: string };

export function TrainingPanel({
  profiles,
  skills,
  evaluations,
  materials,
}: {
  profiles: RosterEntry[];
  skills: Skill[];
  evaluations: EvaluationRow[];
  materials: TrainingMaterial[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Cargar evaluación</CardTitle>
          <CardDescription>Queda en la hoja de vida del soldado.</CardDescription>
        </CardHeader>
        <CardContent>
          <EvaluationForm profiles={profiles} skills={skills} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="font-heading text-base">Evaluaciones recientes</CardTitle>
          {evaluations.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                downloadCsv(
                  `gocs-evaluaciones-${new Date().toISOString().slice(0, 10)}.csv`,
                  evaluations.map((e) => ({
                    fecha: e.evaluated_at,
                    soldado: e.profile?.callsign ?? "",
                    habilidad: e.skill?.name ?? "",
                    resultado: e.result,
                    puntaje: e.score ?? "",
                    notas: e.notes ?? "",
                  }))
                )
              }
            >
              Exportar CSV ({evaluations.length})
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin evaluaciones cargadas.</p>
          ) : (
            evaluations.map((e) => <EvaluationRowItem key={e.id} evaluation={e} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Catálogo de habilidades / módulos</CardTitle>
        </CardHeader>
        <CardContent>
          <SkillCatalogForm skills={skills} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Material de estudio</CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialsPanel materials={materials} />
        </CardContent>
      </Card>
    </div>
  );
}

function EvaluationForm({ profiles, skills }: { profiles: RosterEntry[]; skills: Skill[] }) {
  const [profileIds, setProfileIds] = useState<Set<string>>(new Set());
  const [skillIds, setSkillIds] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SkillResult>("aprobado");
  const [score, setScore] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setSet(next);
  }

  function submit() {
    if (profileIds.size === 0 || skillIds.size === 0) {
      toast.error("Elegí al menos un soldado y un módulo.");
      return;
    }
    startTransition(async () => {
      const res = await evaluateSkill({
        profileIds: Array.from(profileIds),
        skillIds: Array.from(skillIds),
        result,
        score: score ? Number(score) : null,
        notes,
      });
      if (res?.error) toast.error(res.error);
      else {
        toast.success(
          `${profileIds.size * skillIds.size} evaluación(es) cargadas (${profileIds.size} soldados × ${skillIds.size} módulos).`
        );
        setProfileIds(new Set());
        setSkillIds(new Set());
        setNotes("");
        setScore("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block">Soldados ({profileIds.size} seleccionados)</Label>
          <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-border/60 p-3 sm:grid-cols-2">
            {profiles.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={profileIds.has(p.id)}
                  onCheckedChange={() => toggle(profileIds, setProfileIds, p.id)}
                />
                {p.callsign}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Módulos / habilidades ({skillIds.size} seleccionados)</Label>
          <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-border/60 p-3">
            {skills.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={skillIds.has(s.id)}
                  onCheckedChange={() => toggle(skillIds, setSkillIds, s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block">Resultado</Label>
          <Select value={result} onValueChange={(v) => setResult(v as SkillResult)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESULTS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Puntaje (opcional)</Label>
          <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Cargar evaluación"}
      </Button>
    </div>
  );
}

function EvaluationRowItem({ evaluation }: { evaluation: EvaluationRow }) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{evaluation.profile?.callsign ?? "—"}</span>
          <span className="text-muted-foreground">{evaluation.skill?.name ?? "—"}</span>
          <Badge variant="secondary">{evaluation.result}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(evaluation.evaluated_at)}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title: "¿Borrar esta evaluación?", destructive: true }))) return;
          startTransition(async () => {
            const res = await deleteEvaluation(evaluation.id);
            if (res?.error) toast.error(res.error);
          });
        }}
      >
        Borrar
      </Button>
    </div>
  );
}

function SkillCatalogForm({ skills }: { skills: Skill[] }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => (
          <Badge key={s.id} variant="outline">
            {s.name}
          </Badge>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          placeholder="Categoría (ej: Modulo)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Input
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button
        size="sm"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await createSkill({ name, category, description });
            if (res?.error) toast.error(res.error);
            else {
              toast.success("Habilidad agregada.");
              setName("");
              setCategory("");
              setDescription("");
            }
          })
        }
      >
        Agregar al catálogo
      </Button>
    </div>
  );
}

function MaterialsPanel({ materials }: { materials: TrainingMaterial[] }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Input
            placeholder="Categoría (opcional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <div className="flex flex-wrap gap-1.5">
            {["Módulo", "Examen", "Video", "Manual", "Curso"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-gocs-red hover:text-foreground"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Input
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <Button
        size="sm"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await addTrainingMaterial({ title, url, category, description });
            if (res?.error) toast.error(res.error);
            else {
              toast.success("Material agregado.");
              setTitle("");
              setUrl("");
              setCategory("");
              setDescription("");
            }
          })
        }
      >
        Agregar material
      </Button>

      <div className="flex flex-col gap-2">
        {materials.map((m) => (
          <MaterialRow key={m.id} material={m} />
        ))}
      </div>
    </div>
  );
}

function MaterialRow({ material }: { material: TrainingMaterial }) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{material.title}</p>
        {material.url && <p className="truncate text-xs text-muted-foreground">{material.url}</p>}
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title: "¿Borrar este material?", destructive: true }))) return;
          startTransition(async () => {
            const res = await deleteTrainingMaterial(material.id);
            if (res?.error) toast.error(res.error);
          });
        }}
      >
        Borrar
      </Button>
    </div>
  );
}
