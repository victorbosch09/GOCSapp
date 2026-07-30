import type { Metadata } from "next";
import { getOwnEvaluations, getTrainingMaterials } from "@/lib/data/training";
import { formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Entrenamiento — G.O.C.S." };

const RESULT_LABEL: Record<string, string> = {
  aprobado: "Aprobado",
  no_aprobado: "No aprobado",
  en_progreso: "En progreso",
};

const RESULT_BADGE: Record<string, string> = {
  aprobado: "bg-emerald-500/15 text-emerald-400",
  no_aprobado: "bg-destructive/15 text-destructive",
  en_progreso: "bg-amber-500/15 text-amber-400",
};

export default async function EntrenamientoPage() {
  const [evaluations, materials] = await Promise.all([getOwnEvaluations(), getTrainingMaterials()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Entrenamiento</h1>
        <p className="text-muted-foreground">Tu hoja de vida y la biblioteca de material de estudio del clan.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Mi hoja de vida</CardTitle>
          <CardDescription>Evaluaciones cargadas por instructores y mando.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {evaluations.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no tenés evaluaciones cargadas.</p>
          ) : (
            evaluations.map((e) => (
              <div key={e.id} className="rounded-md border border-border/60 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">
                    {(e as unknown as { skill?: { name: string } }).skill?.name ?? "—"}
                  </span>
                  <Badge className={RESULT_BADGE[e.result]} variant="secondary">
                    {RESULT_LABEL[e.result]}
                  </Badge>
                  {e.score != null && <span className="text-muted-foreground">Puntaje: {e.score}</span>}
                </div>
                {e.notes && <p className="mt-1 text-muted-foreground">{e.notes}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.evaluated_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Material de estudio</CardTitle>
          <CardDescription>Biblioteca compartida del clan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay material cargado.</p>
          ) : (
            materials.map((m) => (
              <a
                key={m.id}
                href={m.url ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border/60 p-3 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{m.title}</span>
                  {m.category && <Badge variant="secondary">{m.category}</Badge>}
                </div>
                {m.description && <p className="mt-1 text-muted-foreground">{m.description}</p>}
              </a>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
