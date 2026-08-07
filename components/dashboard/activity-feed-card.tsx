import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type ActivityItem = {
  id: string;
  kind: "compra" | "contrato" | "quiz" | "evaluacion";
  label: string;
  at: string;
};

const KIND_BADGE: Record<ActivityItem["kind"], string> = {
  compra: "bg-primary/15 text-foreground",
  contrato: "bg-emerald-500/15 text-emerald-400",
  quiz: "bg-amber-500/15 text-amber-400",
  evaluacion: "bg-muted text-muted-foreground",
};

const KIND_LABEL: Record<ActivityItem["kind"], string> = {
  compra: "Compra",
  contrato: "Contrato",
  quiz: "Quiz",
  evaluacion: "Evaluación",
};

export function ActivityFeedCard({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Actividad reciente</CardTitle>
        <CardDescription>Tus últimas acciones en el sistema.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin actividad todavía.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Badge className={KIND_BADGE[item.kind]} variant="secondary">
                  {KIND_LABEL[item.kind]}
                </Badge>
                <span className="truncate">{item.label}</span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(item.at)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
