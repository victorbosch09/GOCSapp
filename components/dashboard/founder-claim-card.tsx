"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { claimFounderAccess } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function FounderClaimCard() {
  const [pending, startTransition] = useTransition();

  return (
    <Card className="border-gocs-red/50 bg-gocs-red/5">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-gocs-red">
          Sin mando registrado todavía
        </CardTitle>
        <CardDescription>
          Esta instancia del G.O.C.S. no tiene ningún operador con acceso de mando. Si vos armaste
          este despliegue, reclamá el acceso de fundador para poder aprobar operadores, gestionar
          la tienda y el resto del panel de administración. Esto solo funciona una vez.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await claimFounderAccess();
              if (result?.error) toast.error(result.error);
              else toast.success("Acceso de fundador otorgado. Ya sos mando.");
            })
          }
        >
          {pending ? "Reclamando..." : "Reclamar acceso de fundador"}
        </Button>
      </CardContent>
    </Card>
  );
}
