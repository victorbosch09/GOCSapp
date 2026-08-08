"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  updateTreasurySettings,
  recordTreasuryExpense,
  recordTreasuryAdjustment,
} from "@/lib/actions/admin";
import { formatCredits, formatDateTime } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { useNow } from "@/lib/hooks/use-now";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Treasury, TreasuryTransaction, TreasuryTransactionType } from "@/types/database";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const TYPE_LABEL: Record<TreasuryTransactionType, string> = {
  ingreso: "Ingreso",
  nomina: "Nómina",
  armamento: "Armamento / stock",
  gastos_generales: "Gastos generales",
  ajuste: "Ajuste",
  devolucion: "Devolución (reventa)",
};

const TYPE_BADGE: Record<TreasuryTransactionType, string> = {
  ingreso: "bg-emerald-500/15 text-emerald-400",
  nomina: "bg-primary/15 text-foreground",
  armamento: "bg-amber-500/15 text-amber-400",
  gastos_generales: "bg-amber-500/15 text-amber-400",
  ajuste: "bg-muted text-muted-foreground",
  devolucion: "bg-destructive/15 text-destructive",
};

type TxnRow = TreasuryTransaction & { actor: { callsign: string } | null };

export function TreasuryPanel({
  treasury,
  transactions,
}: {
  treasury: Treasury;
  transactions: TxnRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-gocs-red/30">
        <div className="border-b border-gocs-red/30 bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            Presupuesto general del GOCS
          </p>
          <p
            className={`font-heading text-4xl ${treasury.balance >= 0 ? "text-emerald-400" : "text-destructive"}`}
          >
            {formatCredits(treasury.balance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Actualizado {formatDateTime(treasury.updated_at)}
          </p>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <IncomeSettingsCard weeklyIncome={treasury.weekly_income} />
        <ExpenseForm />
      </div>

      <SummaryCard transactions={transactions} />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle className="font-heading text-base">Movimientos de tesorería</CardTitle>
            <CardDescription>Últimos {transactions.length} registros.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              downloadCsv(
                `gocs-tesoreria-${new Date().toISOString().slice(0, 10)}.csv`,
                transactions.map((t) => ({
                  fecha: t.created_at,
                  tipo: t.type,
                  detalle: t.detail ?? "",
                  monto: t.amount,
                  actor: t.actor?.callsign ?? "Sistema",
                }))
              )
            }
          >
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin movimientos todavía.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={TYPE_BADGE[t.type]} variant="secondary">
                        {TYPE_LABEL[t.type]}
                      </Badge>
                      <span className="truncate text-muted-foreground">{t.detail ?? "—"}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t.actor?.callsign ?? "Sistema"} · {formatDateTime(t.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-medium tabular-nums ${
                      t.amount >= 0 ? "text-emerald-400" : "text-destructive"
                    }`}
                  >
                    {t.amount >= 0 ? "+" : ""}
                    {formatCredits(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ transactions }: { transactions: TxnRow[] }) {
  const now = useNow();
  const { income, expense } = useMemo(() => {
    const cutoff = now - THIRTY_DAYS_MS;
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (new Date(t.created_at).getTime() < cutoff) continue;
      if (t.amount >= 0) income += t.amount;
      else expense += Math.abs(t.amount);
    }
    return { income, expense };
  }, [transactions, now]);

  const net = income - expense;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Últimos 30 días</CardTitle>
        <CardDescription>
          Basado en los {transactions.length} movimientos cargados arriba (puede no cubrir 30 días
          completos si hubo más actividad de la que se muestra).
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Ingresos</p>
          <p className="font-heading text-lg text-emerald-400">+{formatCredits(income)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Egresos</p>
          <p className="font-heading text-lg text-destructive">-{formatCredits(expense)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Neto</p>
          <p className={`font-heading text-lg ${net >= 0 ? "text-emerald-400" : "text-destructive"}`}>
            {net >= 0 ? "+" : ""}
            {formatCredits(net)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function IncomeSettingsCard({ weeklyIncome }: { weeklyIncome: number }) {
  const [value, setValue] = useState(String(weeklyIncome));
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Ingreso semanal por contratistas</CardTitle>
        <CardDescription>
          Se acredita a la tesorería automáticamente en cada corrida de nómina (OLAD paga al GOCS).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Monto semanal (cr)</Label>
          <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} className="w-40" />
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const n = Number(value);
              if (Number.isNaN(n)) {
                toast.error("Monto inválido.");
                return;
              }
              const result = await updateTreasurySettings(n);
              if (result?.error) toast.error(result.error);
              else toast.success("Ingreso semanal actualizado.");
            })
          }
        >
          Guardar
        </Button>
      </CardContent>
    </Card>
  );
}

function ExpenseForm() {
  const [type, setType] = useState<"armamento" | "gastos_generales" | "ajuste">("armamento");
  const [amount, setAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base">Registrar gasto</CardTitle>
        <CardDescription>Ej: reabastecer stock de armamento, gastos generales del clan.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="armamento">Armamento / stock</SelectItem>
              <SelectItem value="gastos_generales">Gastos generales</SelectItem>
              <SelectItem value="ajuste">Ajuste</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Monto (cr)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <Input placeholder="Detalle" value={detail} onChange={(e) => setDetail(e.target.value)} />
        <Button
          size="sm"
          className="self-start"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const n = Number(amount);
              if (!n) {
                toast.error("Ingresá un monto.");
                return;
              }
              const result =
                type === "ajuste"
                  ? await recordTreasuryAdjustment(n, detail)
                  : await recordTreasuryExpense({ type, amount: n, detail });
              if (result?.error) toast.error(result.error);
              else {
                toast.success("Movimiento registrado.");
                setAmount("");
                setDetail("");
              }
            })
          }
        >
          Registrar
        </Button>
      </CardContent>
    </Card>
  );
}
