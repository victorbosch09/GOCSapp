import type { Metadata } from "next";
import { getAllProfiles, getRecentNotifications } from "@/lib/data/admin";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationForm } from "@/components/admin/notification-form";

export const metadata: Metadata = { title: "Notificaciones — Mando G.O.C.S." };

export default async function AdminNotificacionesPage() {
  const [profiles, notifications] = await Promise.all([getAllProfiles(), getRecentNotifications()]);
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
        <CardContent className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div key={n.id} className="rounded-md border border-border/60 p-3 text-sm">
              <div className="flex items-center gap-2">
                <p className="font-medium">{n.title}</p>
                <Badge variant="secondary">
                  {n.target_type === "all" ? "Todos" : n.target_type === "squad" ? `Escuadra ${n.target_id}` : "Individual"}
                </Badge>
              </div>
              {n.body && <p className="mt-1 text-muted-foreground">{n.body}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
