import type { Metadata } from "next";
import { getTeamOverview, getRoster } from "@/lib/data/team";
import { formatCredits, formatDate } from "@/lib/data/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GocsPatch } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Equipo — G.O.C.S." };

export default async function EquipoPage() {
  const [overview, roster] = await Promise.all([getTeamOverview(), getRoster()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Equipo G.O.C.S.</h1>
        <p className="text-muted-foreground">
          Estadísticas del clan y escalafón general. Los saldos individuales son privados.
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Roster general</CardTitle>
          <CardDescription>{roster.length} operadores aprobados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead>Rango</TableHead>
                <TableHead>Escuadra</TableHead>
                <TableHead className="text-right">Ingreso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <GocsPatch size={24} />
                    {r.callsign}
                    {r.is_command_staff && (
                      <Badge variant="secondary" className="text-gocs-red">
                        Mando
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.rank_name ?? "—"}
                    {r.rank_abbreviation ? ` (${r.rank_abbreviation})` : ""}
                  </TableCell>
                  <TableCell>{r.squad ?? "—"}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatDate(r.join_date)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
