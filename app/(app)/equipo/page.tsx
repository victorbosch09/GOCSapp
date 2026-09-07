import type { Metadata } from "next";
import {
  getTeamOverview,
  getRoster,
  getSkillCompletionStats,
  getDisciplineOverview,
  getOperatorRankings,
  getSquadRankings,
  getPinnedAnnouncements,
} from "@/lib/data/team";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RosterSearch } from "@/components/team/roster-search";

export const metadata: Metadata = { title: "Equipo — G.O.C.S." };

function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full bg-gocs-red" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export default async function EquipoPage() {
  const [overview, roster, skillStats, discipline, rankings, squadRankings, announcements] = await Promise.all([
    getTeamOverview(),
    getRoster(),
    getSkillCompletionStats(),
    getDisciplineOverview(),
    getOperatorRankings(),
    getSquadRankings(),
    getPinnedAnnouncements(),
  ]);

  const rankBreakdown = new Map<string, number>();
  const squadBreakdown = new Map<string, number>();
  for (const r of roster) {
    const rankKey = r.rank_name ?? "Sin rango";
    rankBreakdown.set(rankKey, (rankBreakdown.get(rankKey) ?? 0) + 1);
    const squadKey = r.squad ?? "Sin escuadra";
    squadBreakdown.set(squadKey, (squadBreakdown.get(squadKey) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Equipo G.O.C.S.</h1>
        <p className="text-muted-foreground">
          Estadísticas del clan, escalafón general y preparación operativa. Los saldos
          individuales son privados.
        </p>
      </div>

      {announcements.length > 0 && (
        <div className="flex flex-col gap-2">
          {announcements.map((a) => (
            <Card key={a.id} className="border-gocs-red/40 bg-primary/5">
              <CardContent className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">📌 {a.title}</p>
                  {a.body && <p className="text-sm text-muted-foreground">{a.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(a.created_at)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Soldados activos</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {overview?.total_soldados_activos ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Nómina semanal total</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {formatCredits(overview?.nomina_semanal_total ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gasto en armamento</CardDescription>
            <CardTitle className="font-heading text-2xl text-gocs-red">
              {formatCredits(overview?.gasto_total_armamento ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Próximos eventos</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {overview?.proximos_eventos_count ?? 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Escalafón</CardTitle>
            <CardDescription>Distribución de rangos en el clan.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Array.from(rankBreakdown.entries()).map(([rank, count]) => (
              <div key={rank} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate">{rank}</span>
                <Bar pct={(count / Math.max(1, roster.length)) * 100} />
                <span className="w-6 shrink-0 text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Escuadras</CardTitle>
            <CardDescription>Distribución por escuadra.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Array.from(squadBreakdown.entries()).map(([squad, count]) => (
              <div key={squad} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate">{squad}</span>
                <Bar pct={(count / Math.max(1, roster.length)) * 100} />
                <span className="w-6 shrink-0 text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Preparación — módulos y habilidades</CardTitle>
          <CardDescription>% del clan aprobado por módulo/certificación evaluada.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {skillStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin habilidades cargadas todavía.</p>
          ) : (
            skillStats.map((s) => (
              <div key={s.skill_id} className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0 truncate" title={s.skill_name}>
                  {s.skill_name}
                </span>
                <Bar pct={s.porcentaje_aprobado} />
                <span className="w-28 shrink-0 text-right text-muted-foreground">
                  {s.total_aprobados}/{roster.length} ({s.porcentaje_aprobado}%)
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {squadRankings.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Ranking de escuadras (30 días)</CardTitle>
            <CardDescription>Contratos + asistencias sumados por escuadra.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {squadRankings.map((s, i) => (
              <div
                key={s.squad}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={i === 0 ? "secondary" : "outline"} className={i === 0 ? "text-gocs-red" : ""}>
                    #{i + 1}
                  </Badge>
                  <span className="font-medium">{s.squad}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.memberCount} operador{s.memberCount === 1 ? "" : "es"}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {s.contratos30d} contratos · {s.asistencias30d}/{s.eventosOficiales30d} asistencias
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Operadores destacados (30 días)</CardTitle>
            <CardDescription>Por contratos completados y asistencias.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {rankings.length === 0 || rankings.every((r) => r.contratos_30d === 0 && r.asistencias_30d === 0) ? (
              <p className="text-sm text-muted-foreground">
                Sin actividad suficiente en los últimos 30 días.
              </p>
            ) : (
              rankings.map((r, i) => (
                <div
                  key={r.profile_id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant={i === 0 ? "secondary" : "outline"} className={i === 0 ? "text-gocs-red" : ""}>
                      #{i + 1}
                    </Badge>
                    <span className="font-medium">{r.callsign}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {r.contratos_30d} contratos · {r.asistencias_30d}/{r.eventos_oficiales_30d} asistencias
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Disciplina general</CardTitle>
            <CardDescription>Totales del clan (sin exponer quién).</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-heading text-2xl text-destructive">
                {discipline?.total_sanciones ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Sanciones aplicadas</p>
            </div>
            <div>
              <p className="font-heading text-2xl text-emerald-400">
                {discipline?.total_recompensas ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Recompensas entregadas</p>
            </div>
            <div>
              <p className="font-heading text-2xl">
                {formatCredits(discipline?.creditos_en_recompensas ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">En créditos otorgados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Roster general</CardTitle>
          <CardDescription>{roster.length} operadores aprobados.</CardDescription>
        </CardHeader>
        <CardContent>
          <RosterSearch roster={roster} />
        </CardContent>
      </Card>
    </div>
  );
}
