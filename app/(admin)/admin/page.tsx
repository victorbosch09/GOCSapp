import type { Metadata } from "next";
import Link from "next/link";
import { getAllProfiles, getPayrollRuns } from "@/lib/data/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApproveButton } from "@/components/admin/approve-button";

export const metadata: Metadata = { title: "Mando — G.O.C.S." };

export default async function AdminOverviewPage() {
  const [profiles, payrollRuns] = await Promise.all([getAllProfiles(), getPayrollRuns()]);

  const pending = profiles.filter((p) => !p.approved);
  const activeCount = profiles.filter((p) => p.approved).length;
  const commandStaffCount = profiles.filter((p) => p.is_command_staff).length;
  const lastRun = payrollRuns[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Panel de mando</h1>
        <p className="text-muted-foreground">Resumen operativo del G.O.C.S.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Soldados activos</CardDescription>
            <CardTitle className="font-heading text-2xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Postulaciones pendientes</CardDescription>
            <CardTitle className="font-heading text-2xl text-gocs-red">{pending.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plana de mando</CardDescription>
            <CardTitle className="font-heading text-2xl">{commandStaffCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Postulaciones pendientes</CardTitle>
          <CardDescription>Terminar proceso de admisión.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay postulaciones pendientes.</p>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
              >
                <span className="font-medium">{p.callsign}</span>
                <ApproveButton profileId={p.id} />
              </div>
            ))
          )}
          <Button asChild variant="link" className="self-start px-0">
            <Link href="/admin/soldados">Ver todos los soldados →</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Última nómina</CardTitle>
        </CardHeader>
        <CardContent>
          {lastRun ? (
            <p className="text-sm text-muted-foreground">
              {formatDateTime(lastRun.run_at)} · {lastRun.profiles_paid} soldados pagados ·{" "}
              {formatCredits(lastRun.total_amount)}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no se ejecutó ninguna nómina.</p>
          )}
          <Button asChild variant="link" className="mt-1 px-0">
            <Link href="/admin/nomina">Ir a nómina →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
