import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOperatorPortalData } from "@/lib/data/admin";
import { requireCommandStaff } from "@/lib/data/profile";
import { formatCredits, formatDate, formatDateTime, rankLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Portal del operador — Mando G.O.C.S." };

const TXN_BADGE: Record<string, string> = {
  Sueldo: "bg-emerald-500/15 text-emerald-400",
  Bono: "bg-emerald-500/15 text-emerald-400",
  "Compra Armamento": "bg-primary/15 text-foreground",
  "Compra Vehiculo": "bg-primary/15 text-foreground",
  "Venta Armamento": "bg-emerald-500/15 text-emerald-400",
  "Venta Vehiculo": "bg-emerald-500/15 text-emerald-400",
  Descuento: "bg-destructive/15 text-destructive",
  Sancion: "bg-destructive/15 text-destructive",
  "Ajuste Manual": "bg-muted text-muted-foreground",
};

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

export default async function AdminOperatorPortalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCommandStaff();
  const { id } = await params;
  const data = await getOperatorPortalData(id);

  if (!data.profile) notFound();
  const profile = data.profile;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3">
        <p className="text-sm text-amber-500">
          👁 Estás viendo el portal de <strong>{profile.callsign}</strong> como mando. Esto no es tu
          propio portal — tu información personal siempre está en{" "}
          <Link href="/dashboard" className="underline underline-offset-4">
            /dashboard
          </Link>
          .
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl">Portal de operador — {profile.callsign}</h1>
          <p className="text-muted-foreground">
            {profile.squad ? `Escuadra ${profile.squad}` : "Sin escuadra"}
            {profile.is_command_staff ? " · Mando" : ""}
            {profile.is_instructor ? " · Instructor" : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/soldados">← Volver al roster</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rango</CardDescription>
            <CardTitle className="font-heading text-lg">{rankLabel(profile)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sueldo semanal</CardDescription>
            <CardTitle className="font-heading text-lg">
              {formatCredits(profile.rank?.weekly_wage ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo actual</CardDescription>
            <CardTitle className="font-heading text-lg text-gocs-red">
              {formatCredits(profile.cached_balance)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Estado</CardDescription>
            <CardTitle className="font-heading text-lg">
              {profile.approved ? "Aprobado" : "Pendiente"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Movimientos</CardTitle>
          <CardDescription>Últimos {data.transactions.length} registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(t.created_at)}
                    </TableCell>
                    <TableCell>
                      <Badge className={TXN_BADGE[t.type] ?? ""} variant="secondary">
                        {t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">{t.detail ?? "—"}</TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${
                        t.amount >= 0 ? "text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {t.amount >= 0 ? "+" : ""}
                      {formatCredits(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Inventario</CardTitle>
            <CardDescription>Ítems comprados en la tienda.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.inventory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin compras todavía.</p>
            ) : (
              data.inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.item_category ?? item.item_table} · {formatDate(item.acquired_at)}
                    </p>
                  </div>
                  <span className="text-muted-foreground">{formatCredits(item.purchase_price)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Contratos</CardTitle>
            <CardDescription>Bonos ganados por contrato.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.contracts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin contratos todavía.</p>
            ) : (
              data.contracts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
                >
                  <div>
                    <p className="text-muted-foreground">{formatDate(c.contract_date)}</p>
                    {c.risk_level && <Badge variant="outline">Nivel {c.risk_level}</Badge>}
                  </div>
                  <span className="font-medium text-emerald-400">+{formatCredits(c.total_amount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Hoja de vida</CardTitle>
            <CardDescription>Evaluaciones por módulo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin evaluaciones todavía.</p>
            ) : (
              data.evaluations.map((e) => (
                <div key={e.id} className="rounded-md border border-border/60 p-2.5 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{e.skill?.name ?? "—"}</span>
                    <Badge className={RESULT_BADGE[e.result]} variant="secondary">
                      {RESULT_LABEL[e.result]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(e.evaluated_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Quizzes rendidos</CardTitle>
            <CardDescription>Historial de intentos (un solo intento por quiz).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {data.quizAttempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin quizzes rendidos todavía.</p>
            ) : (
              data.quizAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-md border border-border/60 p-2.5 text-sm"
                >
                  <span className="font-medium">{a.quiz?.title ?? "Quiz"}</span>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        a.score / a.total >= 0.7
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }
                      variant="secondary"
                    >
                      {a.score}/{a.total}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(a.completed_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
