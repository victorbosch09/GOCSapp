"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addBuddyMandoPoints, awardBuddyBonus, graduateBuddyTeam, dissolveBuddyTeam } from "@/lib/actions/buddy";
import { useConfirm } from "@/components/ui/confirm-provider";
import type { BuddyTeamFull } from "@/lib/data/buddy";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StaticStars } from "@/components/buddy/star-rating";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

const STATUS_LABEL: Record<string, string> = {
  formando: "Formando equipo",
  en_entrenamiento: "En entrenamiento",
  listo_para_ascender: "Listo para ascender",
  graduado: "Graduado",
  disuelto: "Disuelto",
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

export function BuddyAdminPanel({ teams }: { teams: BuddyTeamFull[] }) {
  const ranked = [...teams].sort((a, b) => b.mando_points - a.mando_points);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Ranking de tríos</CardTitle>
          <CardDescription>Por puntos otorgados por el mando.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {ranked.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tríos formados todavía.</p>
          ) : (
            ranked.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={i === 0 ? "secondary" : "outline"} className={i === 0 ? "text-gocs-red" : ""}>
                    #{i + 1}
                  </Badge>
                  <span className="font-medium">
                    {t.operator_a.callsign} + {t.operator_b.callsign}
                  </span>
                  {t.aspirant && <span className="text-muted-foreground">— {t.aspirant.callsign}</span>}
                </div>
                <span className="font-medium text-gocs-red">{t.mando_points} pts</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Todos los tríos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buddies</TableHead>
                  <TableHead>Aspirante</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Actividades</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead className="text-center">Bonos</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t) => (
                  <TeamRow key={t.id} team={t} />
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamRow({ team }: { team: BuddyTeamFull }) {
  const [pending, startTransition] = useTransition();
  const [points, setPoints] = useState("10");
  const [bonusOpen, setBonusOpen] = useState(false);
  const [bonusAmount, setBonusAmount] = useState("500");
  const [bonusNote, setBonusNote] = useState("");
  const confirm = useConfirm();
  const avg = avgScore(team.ratings);
  const totalBonus = team.bonuses.reduce((s, b) => s + b.amount, 0);

  return (
    <TableRow>
      <TableCell className="font-medium">
        {team.operator_a.callsign} + {team.operator_b.callsign}
        <p className="text-xs font-normal text-muted-foreground">
          Formado el {formatDate(team.formed_at)}
        </p>
      </TableCell>
      <TableCell>{team.aspirant?.callsign ?? "—"}</TableCell>
      <TableCell>
        <Badge className={STATUS_BADGE[team.status]} variant="secondary">
          {STATUS_LABEL[team.status]}
        </Badge>
      </TableCell>
      <TableCell className="text-center">{team.activities.length}</TableCell>
      <TableCell className="text-center">{avg ? <StaticStars score={Math.round(avg)} /> : "—"}</TableCell>
      <TableCell className="text-center font-medium">{team.mando_points}</TableCell>
      <TableCell className="text-center">{totalBonus}cr</TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="h-8 w-16" />
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await addBuddyMandoPoints(team.id, Number(points));
                if (result?.error) toast.error(result.error);
                else toast.success("Puntos actualizados.");
              })
            }
          >
            +Puntos
          </Button>

          <Dialog open={bonusOpen} onOpenChange={setBonusOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                Bono
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Bono para {team.operator_a.callsign} y {team.operator_b.callsign}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Se acredita el mismo monto a cada uno de los dos buddies (no al aspirante).
              </p>
              <div className="flex flex-col gap-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Monto por operador (créditos)</Label>
                  <Input type="number" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Motivo (opcional)</Label>
                  <Textarea value={bonusNote} onChange={(e) => setBonusNote(e.target.value)} rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await awardBuddyBonus(team.id, Number(bonusAmount), bonusNote);
                      if (result?.error) toast.error(result.error);
                      else {
                        toast.success("Bono acreditado a los dos buddies.");
                        setBonusOpen(false);
                        setBonusNote("");
                      }
                    })
                  }
                >
                  Acreditar bono
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {team.status === "listo_para_ascender" && (
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await graduateBuddyTeam(team.id);
                  if (result?.error) toast.error(result.error);
                  else toast.success("Trío graduado. Recordá ascender al aspirante desde /admin/soldados.");
                })
              }
            >
              Graduar
            </Button>
          )}

          {team.status !== "graduado" && team.status !== "disuelto" && (
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={async () => {
                if (
                  !(await confirm({
                    title: "¿Disolver este trío?",
                    description: "El aspirante y los operadores vuelven a estar disponibles.",
                    destructive: true,
                  }))
                )
                  return;
                startTransition(async () => {
                  const result = await dissolveBuddyTeam(team.id);
                  if (result?.error) toast.error(result.error);
                  else toast.success("Trío disuelto.");
                });
              }}
            >
              Disolver
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
