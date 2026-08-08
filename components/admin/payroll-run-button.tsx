"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { runPayrollNow } from "@/lib/actions/admin";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Button } from "@/components/ui/button";

export function PayrollRunButton() {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  return (
    <Button
      disabled={pending}
      onClick={async () => {
        if (
          !(await confirm({
            title: "¿Ejecutar el pago semanal ahora?",
            description: "Se paga a todos los soldados aprobados, fuera del cronograma habitual.",
          }))
        )
          return;
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
