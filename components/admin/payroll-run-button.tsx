"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { runPayrollNow } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function PayrollRunButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Ejecutar el pago semanal ahora para todos los soldados aprobados?")) return;
        startTransition(async () => {
          const result = await runPayrollNow();
          if (result?.error) toast.error(result.error);
          else toast.success("Nómina ejecutada.");
        });
      }}
    >
      {pending ? "Ejecutando..." : "Ejecutar pago semanal ahora"}
    </Button>
  );
}
