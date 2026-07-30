import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/data/profile";
import { getOwnTransactions, getOwnContracts, getOwnNotifications } from "@/lib/data/dashboard";
import { nextPaymentDate, formatCredits, formatDate, formatDateTime, rankLabel } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata: Metadata = { title: "Portal — G.O.C.S." };

const TXN_BADGE: Record<string, string> = {
  Sueldo: "bg-emerald-500/15 text-emerald-400",
  Bono: "bg-emerald-500/15 text-emerald-400",
  "Compra Armamento": "bg-primary/15 text-foreground",
  "Compra Vehiculo": "bg-primary/15 text-foreground",
  Descuento: "bg-destructive/15 text-destructive",
  Sancion: "bg-destructive/15 text-destructive",
  "Ajuste Manual": "bg-muted text-muted-foreground",
};

export default async function DashboardPage() {
  const [profile, transactions, contracts, notifications] = await Promise.all([
    getCurrentProfile(),
    getOwnTransactions(),
    getOwnContracts(),
    getOwnNotifications(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Portal de operador</h1>
        <p className="text-muted-foreground">
          {profile.callsign}
          {profile.squad ? ` · Escuadra ${profile.squad}` : ""}
        </p>
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
            <CardDescription>Próximo pago</CardDescription>
            <CardTitle className="font-heading text-lg">
              {formatDate(nextPaymentDate())}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-base">Movimientos recientes</CardTitle>
            <CardDescription>Sueldos, bonos, compras y descuentos.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no tenés movimientos.</p>
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
                  {transactions.map((t) => (
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

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base">Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="rounded-md border border-border/60 p-3">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Historial de contratos</CardTitle>
          <CardDescription>Bonos ganados por contrato.</CardDescription>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no participaste de contratos.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Nivel de riesgo</TableHead>
                  <TableHead>Bonos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(c.contract_date)}
                    </TableCell>
                    <TableCell>{c.risk_level ? `Nivel ${c.risk_level}` : "—"}</TableCell>
                    <TableCell className="max-w-[280px]">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(c.bonuses) && c.bonuses.length > 0 ? (
                          (c.bonuses as string[]).map((b) => (
                            <Badge key={b} variant="secondary">
                              {b}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-emerald-400">
                      +{formatCredits(c.total_amount)}
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
