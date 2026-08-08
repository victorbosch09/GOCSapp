"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updatePayrollSettings } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PayrollSettings } from "@/types/database";

export function PayrollSettingsForm({ settings }: { settings: PayrollSettings }) {
  const [thresholdPct, setThresholdPct] = useState(String(Math.round(settings.attendance_threshold * 100)));
  const [gatingEnabled, setGatingEnabled] = useState(settings.attendance_gating_enabled);
  const [autoRunEnabled, setAutoRunEnabled] = useState(settings.auto_run_enabled);
  const [pending, startTransition] = useTransition();

  function save() {
    const pct = Number(thresholdPct);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      toast.error("El porcentaje debe estar entre 0 y 100.");
      return;
    }
    startTransition(async () => {
      const result = await updatePayrollSettings({
        attendance_threshold: pct / 100,
        attendance_gating_enabled: gatingEnabled,
        auto_run_enabled: autoRunEnabled,
      });
      if (result?.error) toast.error(result.error);
      else toast.success("Configuración de nómina actualizada.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
        <div>
          <p className="text-sm font-medium">Condicionar el sueldo a la asistencia</p>
          <p className="text-xs text-muted-foreground">
            Si está apagado, se paga a todos los aprobados sin mirar asistencia.
          </p>
        </div>
        <Switch checked={gatingEnabled} onCheckedChange={setGatingEnabled} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Umbral mínimo de asistencia (%)</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={thresholdPct}
          onChange={(e) => setThresholdPct(e.target.value)}
          disabled={!gatingEnabled}
          className="w-32"
        />
        <p className="text-xs text-muted-foreground">
          Por debajo de este % de asistencia a actividades oficiales de la semana, no se acredita
          el sueldo. El original del clan usa 50%.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
        <div>
          <p className="text-sm font-medium">Cron automático semanal habilitado</p>
          <p className="text-xs text-muted-foreground">
            El botón manual &quot;Ejecutar pago semanal ahora&quot; siempre funciona, esté esto prendido o no.
          </p>
        </div>
        <Switch checked={autoRunEnabled} onCheckedChange={setAutoRunEnabled} />
      </div>

      <Button onClick={save} disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar configuración"}
      </Button>
    </div>
  );
}
