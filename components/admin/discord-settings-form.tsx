"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateIntegrationSettings } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { IntegrationSettings } from "@/types/database";

export function DiscordSettingsForm({ settings }: { settings: IntegrationSettings | null }) {
  const [url, setUrl] = useState(settings?.discord_webhook_url ?? "");
  const [notifyOnEvent, setNotifyOnEvent] = useState(settings?.notify_on_event ?? true);
  const [notifyOnNotification, setNotifyOnNotification] = useState(
    settings?.notify_on_notification ?? true
  );
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await updateIntegrationSettings({
        discord_webhook_url: url.trim() || null,
        notify_on_event: notifyOnEvent,
        notify_on_notification: notifyOnNotification,
      });
      if (result?.error) toast.error(result.error);
      else toast.success("Integración con Discord actualizada.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>URL del webhook de Discord</Label>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
        />
        <p className="text-xs text-muted-foreground">
          Se crea desde Discord: Configuración del servidor → Integraciones → Webhooks → Nuevo
          webhook, elegís el canal y copiás la URL acá. No hace falta crear ningún bot. Dejalo
          vacío para desactivar.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
        <div>
          <p className="text-sm font-medium">Avisar en Discord al crear un evento</p>
          <p className="text-xs text-muted-foreground">Entrenamientos, operaciones, pagos.</p>
        </div>
        <Switch checked={notifyOnEvent} onCheckedChange={setNotifyOnEvent} disabled={!url.trim()} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
        <div>
          <p className="text-sm font-medium">Avisar en Discord al enviar una notificación</p>
          <p className="text-xs text-muted-foreground">A todos, a una escuadra o a un soldado.</p>
        </div>
        <Switch
          checked={notifyOnNotification}
          onCheckedChange={setNotifyOnNotification}
          disabled={!url.trim()}
        />
      </div>

      <Button onClick={save} disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar integración"}
      </Button>
    </div>
  );
}
