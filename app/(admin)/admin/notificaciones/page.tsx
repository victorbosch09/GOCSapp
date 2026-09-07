import type { Metadata } from "next";
import { headers } from "next/headers";
import { getAllProfiles, getRecentNotifications, getIntegrationSettings } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { NotificationForm } from "@/components/admin/notification-form";
import { NotificationList } from "@/components/admin/notification-list";
import { DiscordSettingsForm } from "@/components/admin/discord-settings-form";
import { AttendanceWebhookPanel } from "@/components/admin/attendance-webhook-panel";

export const metadata: Metadata = { title: "Notificaciones — Mando G.O.C.S." };

export default async function AdminNotificacionesPage() {
  const [profiles, notifications, integrationSettings, headersList] = await Promise.all([
    getAllProfiles(),
    getRecentNotifications(),
    getIntegrationSettings(),
    headers(),
  ]);
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  const siteUrl = host ? `${protocol}://${host}` : "";
  const squads = Array.from(new Set(profiles.map((p) => p.squad).filter((s): s is string => !!s)));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Notificaciones</h1>
        <p className="text-muted-foreground">A todos, a una escuadra o a un soldado específico.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Nueva notificación</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationForm profiles={profiles.filter((p) => p.approved)} squads={squads} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Enviadas recientemente</CardTitle>
          <CardDescription>{notifications.length} registros.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationList notifications={notifications} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Integración con Discord</CardTitle>
          <CardDescription>Espejo opcional de eventos y notificaciones en un canal del servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <DiscordSettingsForm settings={integrationSettings} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Webhook de asistencia (Apollo)</CardTitle>
          <CardDescription>Recibe una marca de &quot;asiste en Discord&quot; desde afuera, si algo se la manda.</CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceWebhookPanel
            secret={integrationSettings?.attendance_webhook_secret ?? null}
            siteUrl={siteUrl}
          />
        </CardContent>
      </Card>
    </div>
  );
}
