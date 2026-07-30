import type { Metadata } from "next";
import { getPayrollRuns } from "@/lib/data/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PayrollRunButton } from "@/components/admin/payroll-run-button";

export const metadata: Metadata = { title: "Nómina — Mando G.O.C.S." };

export default async function AdminNominaPage() {
  const runs = await getPayrollRuns();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl">Nómina semanal</h1>
          <p className="text-muted-foreground">
            Corre automáticamente cada semana. Usá el botón como respaldo manual.
          </p>
        </div>
        <PayrollRunButton />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Historial de ejecuciones</CardTitle>
          <CardDescription>Últimas {runs.length} corridas.</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no se ejecutó ninguna nómina.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Soldados pagados</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(run.run_at)}
                    </TableCell>
                    <TableCell>{run.triggered_by ? "Manual" : "Automático"}</TableCell>
                    <TableCell>{run.profiles_paid}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCredits(run.total_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={run.status === "success" ? "secondary" : "outline"}>
                        {run.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
