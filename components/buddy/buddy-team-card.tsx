"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  draftAspirant,
  logBuddyActivity,
  rateBuddyAspirant,
  markTeamReadyForPromotion,
} from "@/lib/actions/buddy";
import type { BuddyTeamFull, BuddyProfile } from "@/lib/data/buddy";
import { formatDate } from "@/lib/format";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StarRating, StaticStars } from "@/components/buddy/star-rating";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_LABEL: Record<string, string> = {
  formando: "Formando equipo",
  en_entrenamiento: "En entrenamiento",
  listo_para_ascender: "Listo para ascender",
  graduado: "Graduado",
  disuelto: "Disuelto",
};

const STATUS_BORDER: Record<string, string> = {
  formando: "border-border/60",
  en_entrenamiento: "border-primary/50",
  listo_para_ascender: "border-amber-500/50",
  graduado: "border-emerald-500/50",
  disuelto: "border-border/60",
};

const STATUS_BADGE: Record<string, string> = {
  formando: "bg-muted text-muted-foreground",
  en_entrenamiento: "bg-primary/15 text-foreground",
  listo_para_ascender: "bg-amber-500/15 text-amber-400",
  graduado: "bg-emerald-500/15 text-emerald-400",
  disuelto: "bg-muted text-muted-foreground",
};

function avgScore(ratings: BuddyTeamFull["ratings"]) {
  if (ratings.length === 0) return null;
  return ratings.reduce((s, r) => s + r.score, 0) / ratings.length;
}

function readinessPct(team: BuddyTeamFull) {
  const avg = avgScore(team.ratings) ?? 0;
  return Math.min(100, team.activities.length * 12 + avg * 12);
}

function MiniAvatar({ profile, ring }: { profile: BuddyProfile; ring?: string }) {
  return (
    <Avatar className={ring ? `ring-2 ${ring}` : undefined}>
      {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.callsign} />}
      <AvatarFallback>{profile.callsign.slice(0, 2).toUpperCase()}</AvatarFallback>
    </Avatar>
  );
}

export function BuddyTeamCard({
  team,
  isMine,
  availableAspirants,
}: {
  team: BuddyTeamFull;
  isMine: boolean;
  availableAspirants: BuddyProfile[];
}) {
  const [pending, startTransition] = useTransition();
  const [draftOpen, setDraftOpen] = useState(false);
  const [selectedAspirant, setSelectedAspirant] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingNote, setRatingNote] = useState("");

  const avg = avgScore(team.ratings);
  const readiness = readinessPct(team);

  return (
    <Card className={`overflow-hidden border-l-4 ${STATUS_BORDER[team.status]}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              <MiniAvatar profile={team.operator_a} ring="ring-background" />
              <MiniAvatar profile={team.operator_b} ring="ring-background" />
            </div>
            <div>
              <CardTitle className="font-heading text-base">
                {team.operator_a.callsign} + {team.operator_b.callsign}
              </CardTitle>
              <CardDescription>Equipo desde el {formatDate(team.formed_at)}</CardDescription>
            </div>
          </div>
          <Badge className={STATUS_BADGE[team.status]} variant="secondary">
            {STATUS_LABEL[team.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!team.aspirant ? (
          isMine ? (
            <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={availableAspirants.length === 0} className="self-start">
                  🎯 Draftear aspirante
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Elegir aspirante</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {availableAspirants.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAspirant(a.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-center transition-colors ${
                        selectedAspirant === a.id
                          ? "border-gocs-red bg-primary/10"
                          : "border-border/60 hover:bg-muted"
                      }`}
                    >
                      <MiniAvatar profile={a} />
                      <span className="text-xs font-medium">{a.callsign}</span>
                    </button>
                  ))}
                </div>
                {availableAspirants.length === 0 && (
                  <p className="text-sm text-muted-foreground">No hay candidatos disponibles ahora mismo.</p>
                )}
                <DialogFooter>
                  <Button
                    disabled={!selectedAspirant || pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await draftAspirant(team.id, selectedAspirant);
                        if (result?.error) toast.error(result.error);
                        else {
                          toast.success("Aspirante drafteado.");
                          setDraftOpen(false);
                          setSelectedAspirant("");
                        }
                      })
                    }
                  >
                    Confirmar draft
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no draftearon un aspirante.</p>
          )
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 p-3">
              <MiniAvatar profile={team.aspirant} ring="ring-gocs-red/40" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{team.aspirant.callsign}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gocs-red transition-all" style={{ width: `${readiness}%` }} />
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {avg && <StaticStars score={Math.round(avg)} />}
                <p>{team.activities.length} actividades</p>
              </div>
            </div>

            {isMine && (
              <>
                <div className="flex flex-col gap-2">
                  <Textarea
                    value={activityNote}
                    onChange={(e) => setActivityNote(e.target.value)}
                    placeholder="Registrar una actividad de entrenamiento..."
                    rows={2}
                  />
                  <Button
                    size="sm"
                    className="self-start"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await logBuddyActivity(team.id, activityNote);
                        if (result?.error) toast.error(result.error);
                        else {
                          toast.success("Actividad registrada.");
                          setActivityNote("");
                        }
                      })
                    }
                  >
                    Registrar actividad
                  </Button>
                </div>

                <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Calificar a {team.aspirant.callsign}
                  </p>
                  <StarRating value={ratingScore} onChange={setRatingScore} />
                  <Textarea
                    value={ratingNote}
                    onChange={(e) => setRatingNote(e.target.value)}
                    placeholder="Comentario (opcional)"
                    rows={1}
                  />
                  <Button
                    size="sm"
                    className="self-start"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await rateBuddyAspirant(team.id, ratingScore, ratingNote);
                        if (result?.error) toast.error(result.error);
                        else {
                          toast.success("Calificación guardada.");
                          setRatingNote("");
                        }
                      })
                    }
                  >
                    Calificar
                  </Button>
                </div>

                {team.status === "en_entrenamiento" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="self-start"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await markTeamReadyForPromotion(team.id);
                        if (result?.error) toast.error(result.error);
                        else toast.success("Marcado como listo para ascender.");
                      })
                    }
                  >
                    🎓 Marcar listo para ascender
                  </Button>
                )}
              </>
            )}

            {!isMine && team.activities.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Ver actividades y calificaciones</summary>
                <div className="mt-2 flex flex-col gap-1.5">
                  {team.activities.map((a) => (
                    <p key={a.id}>
                      <span className="font-medium">{a.author?.callsign ?? "—"}</span>: {a.note}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </>
        )}

        <div className="flex items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>
            Puntos de mando: <strong className="text-foreground">{team.mando_points}</strong>
          </span>
          {team.bonuses.length > 0 && (
            <span>
              Bonos totales:{" "}
              <strong className="text-foreground">
                {team.bonuses.reduce((s, b) => s + b.amount, 0)}cr
              </strong>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
