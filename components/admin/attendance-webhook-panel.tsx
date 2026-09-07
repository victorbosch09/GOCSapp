"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { regenerateAttendanceWebhookSecret } from "@/lib/actions/admin";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AttendanceWebhookPanel({
  secret,
  siteUrl,
}: {
  secret: string | null;
  siteUrl: string;
}) {
  const [currentSecret, setCurrentSecret] = useState(secret);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const endpoint = `${siteUrl}/api/webhooks/attendance`;

  async function regenerate() {
    if (
      currentSecret &&
      !(await confirm({
        title: "¿Regenerar el secreto del webhook?",
        description: "Cualquier integración que use el secreto anterior deja de funcionar.",
      }))
    )
      return;
    startTransition(async () => {
      const result = await regenerateAttendanceWebhookSecret();
      if (result?.error) toast.error(result.error);
      else {
        setCurrentSecret(result.secret ?? null);
        toast.success("Secreto generado.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        GOCS no tiene forma verificada de conectarse directamente a Apollo (el bot de RSVP es
        externo, no lo controlamos). Este endpoint recibe una actualización de asistencia si algo
        se la manda — revisá si Apollo tiene alguna opción de integración/webhook en su
        configuración y apuntala acá, o usalo desde un script propio.
      </p>

      <div className="flex flex-col gap-1.5">
        <Label>URL del endpoint</Label>
        <Input readOnly value={endpoint} onClick={(e) => e.currentTarget.select()} className="font-mono text-xs" />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Secreto ({"header "}<code>X-Webhook-Secret</code>)</Label>
        <Input
          readOnly
          value={currentSecret ?? "Sin generar todavía"}
          onClick={(e) => e.currentTarget.select()}
          className="font-mono text-xs"
        />
      </div>

      <Button size="sm" variant="outline" className="self-start" disabled={pending} onClick={regenerate}>
        {pending ? "Generando..." : currentSecret ? "Regenerar secreto" : "Generar secreto"}
      </Button>

      <details className="rounded-md border border-border/60 p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">Formato del POST</summary>
        <pre className="mt-2 overflow-x-auto">{`POST ${endpoint}
X-Webhook-Secret: <secreto de arriba>
Content-Type: application/json

{
  "discord_username": "usuario_de_discord",
  "response": "asiste" | "tal_vez" | "no_asiste",
  "event_date": "2026-09-10"
}`}</pre>
        <p className="mt-2">
          Empareja por <code>profiles.discord_username</code> (cada operador lo carga en su
          perfil) y busca el evento de GOCS de esa fecha.
        </p>
      </details>
    </div>
  );
}
