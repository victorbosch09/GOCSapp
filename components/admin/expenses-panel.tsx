"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { payRecurringExpense, toggleRecurringExpense, createRecurringExpense } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, AlertTriangle, TrendingDown, Users, Truck, Crosshair } from "lucide-react";
import type { RecurringExpense, ExpensePayment } from "@/types/database";

type ExpenseWithPayments = RecurringExpense & { payments?: ExpensePayment[] };

function computeAmount(expense: RecurringExpense, soldierCount: number, totalVehicleStock: number, totalWeaponStock: number): number {
  const scale =
    expense.scales_with === "soldiers" ? soldierCount :
    expense.scales_with === "vehicles" ? totalVehicleStock :
    expense.scales_with === "weapons_stock" ? totalWeaponStock : 0;
  return expense.base_amount + (expense.scale_rate ?? 0) * scale;
}

function ScaleIcon({ scales_with }: { scales_with: string | null }) {
  if (scales_with === "soldiers") return <Users size={12} className="text-muted-foreground" />;
  if (scales_with === "vehicles") return <Truck size={12} className="text-muted-foreground" />;
  if (scales_with === "weapons_stock") return <Crosshair size={12} className="text-muted-foreground" />;
  return null;
}

const CATEGORIES = ["Seguro", "Infraestructura", "Logística", "Personal", "Intel", "Otro"];

export function ExpensesPanel({
  expenses,
  payments,
  soldierCount,
  totalVehicleStock,
  totalWeaponStock,
}: {
  expenses: RecurringExpense[];
  payments: ExpensePayment[];
  soldierCount: number;
  totalVehicleStock: number;
  totalWeaponStock: number;
}) {
  const activeExpenses = expenses.filter((e) => e.is_active);
  const weeklyBurn = activeExpenses.reduce(
    (s, e) => s + computeAmount(e, soldierCount, totalVehicleStock, totalWeaponStock),
    0,
  );
  const monthlyBurn = Math.round(weeklyBurn * 4.33);

  const recentPayments = payments.slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-tile">
          <p className="stat-tile-label">Gastos activos</p>
          <p className="stat-tile-value">{activeExpenses.length}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Soldados activos</p>
          <p className="stat-tile-value">{soldierCount}</p>
        </div>
        <div className="stat-tile">
          <p className="stat-tile-label">Quema semanal</p>
          <p className="stat-tile-value text-destructive">{formatCredits(weeklyBurn)}</p>
        </div>
        <div className="stat-tile col-span-2 sm:col-span-1">
          <p className="stat-tile-label">Quema mensual est.</p>
          <p className="stat-tile-value text-destructive">{formatCredits(monthlyBurn)}</p>
        </div>
      </div>

      {weeklyBurn > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle size={15} className="shrink-0" />
          <span>La unidad quema <strong>{formatCredits(weeklyBurn)}</strong>/semana en gastos operativos con {soldierCount} soldados activos, {totalVehicleStock} vehículos y {totalWeaponStock} armas en inventario.</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg">Gastos operativos</h2>
        <NewExpenseDialog />
      </div>

      <div className="flex flex-col gap-3">
        {expenses.map((expense) => (
          <ExpenseRow
            key={expense.id}
            expense={expense}
            soldierCount={soldierCount}
            totalVehicleStock={totalVehicleStock}
            totalWeaponStock={totalWeaponStock}
          />
        ))}
        {expenses.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay gastos registrados todavía.</p>
        )}
      </div>

      {recentPayments.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-destructive" />
            <h2 className="font-heading text-lg">Últimos pagos</h2>
          </div>
          <div className="flex flex-col gap-2">
            {recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{(p as any).expense_name ?? p.expense_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.period_label ?? "—"} · {new Date(p.created_at).toLocaleDateString("es")}
                  </p>
                </div>
                <span className="font-heading text-sm text-destructive">−{formatCredits(p.amount_paid)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ExpenseRow({
  expense,
  soldierCount,
  totalVehicleStock,
  totalWeaponStock,
}: {
  expense: RecurringExpense;
  soldierCount: number;
  totalVehicleStock: number;
  totalWeaponStock: number;
}) {
  const [pending, startTransition] = useTransition();
  const [payOpen, setPayOpen] = useState(false);
  const [period, setPeriod] = useState("");

  const amount = computeAmount(expense, soldierCount, totalVehicleStock, totalWeaponStock);
  const scaleCount =
    expense.scales_with === "soldiers" ? soldierCount :
    expense.scales_with === "vehicles" ? totalVehicleStock :
    expense.scales_with === "weapons_stock" ? totalWeaponStock : 0;

  function handleToggle(active: boolean) {
    startTransition(async () => {
      const result = await toggleRecurringExpense(expense.id, active);
      if (result?.error) toast.error(result.error);
      else toast.success(active ? `"${expense.name}" activado.` : `"${expense.name}" desactivado.`);
    });
  }

  function handlePay() {
    startTransition(async () => {
      const result = await payRecurringExpense({ expenseId: expense.id, amountPaid: amount, periodLabel: period || "" });
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`Pago de ${formatCredits(amount)} registrado para "${expense.name}".`);
        setPayOpen(false);
        setPeriod("");
      }
    });
  }

  return (
    <div className={`card-tactical p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${!expense.is_active ? "opacity-50" : ""}`}>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{expense.name}</p>
          <Badge variant="outline" className="text-xs">{expense.category}</Badge>
          {expense.scales_with && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ScaleIcon scales_with={expense.scales_with} />
              Escala con {expense.scales_with === "soldiers" ? "soldados" : expense.scales_with === "vehicles" ? "vehículos" : "armas"}
            </span>
          )}
        </div>
        {expense.description && <p className="text-xs text-muted-foreground">{expense.description}</p>}
        {expense.scales_with && (
          <p className="text-xs text-muted-foreground font-mono">
            {formatCredits(expense.base_amount)} base + {formatCredits(expense.scale_rate ?? 0)} × {scaleCount} = <strong className="text-foreground">{formatCredits(amount)}</strong>
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Por período</p>
          <p className="font-heading text-lg text-primary">{formatCredits(amount)}</p>
        </div>

        <Switch checked={expense.is_active} onCheckedChange={handleToggle} disabled={pending} />

        <Dialog open={payOpen} onOpenChange={setPayOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" disabled={!expense.is_active || pending}>
              Pagar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagar — {expense.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-sm">
                {expense.scales_with ? (
                  <>
                    <p className="text-muted-foreground">Cálculo dinámico</p>
                    <p className="font-mono text-xs text-muted-foreground mt-1">
                      {formatCredits(expense.base_amount)} + {formatCredits(expense.scale_rate ?? 0)} × {scaleCount} ({expense.scales_with === "soldiers" ? "soldados" : expense.scales_with === "vehicles" ? "vehículos" : "armas"})
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Costo fijo</p>
                )}
                <p className="font-heading text-2xl text-destructive mt-1">{formatCredits(amount)}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Período (opcional)</Label>
                <Input
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ej: Semana 45 / Nov 2026"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handlePay} disabled={pending} variant="destructive">
                {pending ? "Procesando..." : `Confirmar — ${formatCredits(amount)}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function NewExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [baseAmount, setBaseAmount] = useState("");
  const [scalesWith, setScalesWith] = useState<"" | "soldiers" | "vehicles" | "weapons_stock">("");
  const [scaleRate, setScaleRate] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const base = Number(baseAmount);
    if (!name.trim() || !category || !base || base < 0) {
      toast.error("Completá nombre, categoría y monto base.");
      return;
    }
    startTransition(async () => {
      const result = await createRecurringExpense({
        name,
        category,
        description,
        base_amount: base,
        scales_with: scalesWith || null,
        scale_rate: scalesWith ? Number(scaleRate) || 0 : 0,
        frequency: "weekly" as const,
      });
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`"${name}" añadido a gastos recurrentes.`);
        setName(""); setCategory(""); setDescription(""); setBaseAmount(""); setScalesWith(""); setScaleRate("");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus size={13} /> Nuevo gasto
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuevo gasto recurrente</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Seguro de vida" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Categoría</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Descripción (opcional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs">Monto base (cr)</Label>
              <Input type="number" min={0} value={baseAmount} onChange={(e) => setBaseAmount(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs">Escala con</Label>
              <Select value={scalesWith} onValueChange={(v) => setScalesWith(v as typeof scalesWith)}>
                <SelectTrigger><SelectValue placeholder="Sin escala" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin escala (fijo)</SelectItem>
                  <SelectItem value="soldiers">Soldados activos</SelectItem>
                  <SelectItem value="vehicles">Vehículos en inventario</SelectItem>
                  <SelectItem value="weapons_stock">Armas en inventario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {scalesWith && (
            <div>
              <Label className="mb-1.5 block text-xs">Tasa por unidad (cr)</Label>
              <Input type="number" min={0} value={scaleRate} onChange={(e) => setScaleRate(e.target.value)} placeholder="Ej: 75" className="w-40" />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={pending}>{pending ? "Añadiendo..." : "Añadir gasto"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
