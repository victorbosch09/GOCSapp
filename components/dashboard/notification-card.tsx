"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/profile";
import { formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/types/database";

type NotificationWithRead = Notification & { read: boolean };

export function NotificationCard({ notifications }: { notifications: NotificationWithRead[] }) {
  const [pending, startTransition] = useTransition();
  const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="font-heading text-base">Notificaciones</CardTitle>
        {unreadIds.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await markAllNotificationsRead(unreadIds);
                if (result?.error) toast.error(result.error);
              })
            }
          >
            {pending ? "..." : "Marcar todas leídas"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin notificaciones.</p>
        ) : (
          notifications.map((n) => <NotificationRow key={n.id} notification={n} />)
        )}
      </CardContent>
    </Card>
  );
}

function NotificationRow({ notification }: { notification: NotificationWithRead }) {
  const [pending, startTransition] = useTransition();

  return (
    <div
      className={`rounded-md border p-3 ${
        notification.read ? "border-border/60" : "border-primary/50 bg-primary/5"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {!notification.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-gocs-red" />}
          <p className="text-sm font-medium">{notification.title}</p>
        </div>
        {!notification.read && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 shrink-0 px-2 text-xs"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markNotificationRead(notification.id);
              })
            }
          >
            {pending ? "..." : "Marcar leída"}
          </Button>
        )}
      </div>
      {notification.body && <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
    </div>
  );
}
