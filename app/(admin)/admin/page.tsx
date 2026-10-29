import type { Metadata } from "next";
import Link from "next/link";
import { getAllProfiles, getPayrollRuns, getAuditLog } from "@/lib/data/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApproveButton } from "@/components/admin/approve-button";

export const metadata: Metadata = { title: "Mando — G.O.C.S." };

const QUICK_ACTIONS = [
  { href: "/admin/operaciones-masivas", label: "Operaciones en Lote", desc: "Módulos, bonos, sanciones a varios operadores" },
  { href: "/admin/contratos", label: "Registrar Contrato", desc: "Pago de bonos por operación" },
  { href: "/admin/nomina", label: "Ejecutar Nómina", desc: "Pago semanal de sueldos" },
  { href: "/admin/notificaciones", label: "Enviar Notificación", desc: "Avisos al clan" },
  { href: "/admin/sanciones", label: "Aplicar Sanción", desc: "Registro de faltas disciplinarias" },
  { href: "/admin/calendario", label: "Crear Evento", desc: "Eventos y operaciones del clan" },
];

export default async function AdminOverviewPage() {
  const [profiles, payrollRuns, audit] = await Promise.all([
    getAllProfiles(),
    getPayrollRuns(),
    getAuditLog(),
  ]);

  const pending = profiles.filter((p) => !p.approved);
  const activeCount = profiles.filter((p) => p.approved).length;
  const commandStaffCount = profiles.filter((p) => p.is_command_staff).length;
  const instructorCount = profiles.filter((p) => p.is_instructor).length;
  const lastRun = payrollRuns[0];
  const recentAudit = audit.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Panel de Mando</h1>
        <p className="text-muted-foreground">Resumen operativo del G.O.C.S.</p>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Soldados activos", value: activeCount, accent: false },
          { label: "Pendientes de aprobación", value: pending.length, accent: pending.length > 0 },
          { label: "Plana de mando", value: commandStaffCount, accent: false },
          { label: "Instructores", value: instructorCount, accent: false },
        ].map((s) => (
          <div key={s.label} className="stat-tile">
            <p className="stat-tile-label">{s.label}</p>
            <p className={`stat-tile-value ${s.accent ? "text-gocs-red" : ""}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="section-header">Acciones rápidas</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="card-tactical p-4 block group hover:border-primary/40 transition-colors">
              <p className="font-heading text-sm tracking-wide group-hover:text-primary transition-colors">{a.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Postulaciones pendientes</CardTitle>
            <CardDescription>{pending.length} operador{pending.length !== 1 ? "es" : ""} esperando aprobación.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
              >
                <span className="font-medium">{p.callsign}</span>
                <ApproveButton profileId={p.id} />
              </div>
            ))}
            <Button asChild variant="link" className="self-start px-0 text-muted-foreground">
              <Link href="/admin/soldados">Ver todos los soldados →</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Last payroll */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Última nómina</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {lastRun ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="stat-tile py-3">
                  <p className="stat-tile-value text-xl">{lastRun.profiles_paid}</p>
                  <p className="stat-tile-label">Soldados pagados</p>
                </div>
                <div className="stat-tile py-3 col-span-2">
                  <p className="stat-tile-value text-xl text-emerald-400">{formatCredits(lastRun.total_amount)}</p>
                  <p className="stat-tile-label">Total · {formatDateTime(lastRun.run_at)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Todavía no se ejecutó ninguna nómina.</p>
            )}
            <Button asChild variant="link" className="self-start px-0 text-muted-foreground">
              <Link href="/admin/nomina">Ir a nómina →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent audit */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Actividad reciente</CardTitle>
            <CardDescription>Últimas acciones del mando.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            {recentAudit.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
            ) : (
              recentAudit.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-2 text-sm border-b border-border/30 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="shrink-0 text-xs">{entry.action}</Badge>
                    <span className="truncate text-muted-foreground">{entry.detail ?? "—"}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</span>
                </div>
              ))
            )}
            <Button asChild variant="link" className="self-start px-0 text-muted-foreground mt-1">
              <Link href="/admin/auditoria">Ver auditoría completa →</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
