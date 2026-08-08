"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteNotification } from "@/lib/actions/admin";
import { useConfirm } from "@/components/ui/confirm-provider";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/types/database";

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin notificaciones enviadas todavía.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {notifications.map((n) => (
        <NotificationRow key={n.id} notification={n} />
      ))}
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{notification.title}</p>
          <Badge variant="secondary">
            {notification.target_type === "all"
              ? "Todos"
              : notification.target_type === "squad"
                ? `Escuadra ${notification.target_id}`
                : "Individual"}
          </Badge>
        </div>
        {notification.body && <p className="mt-1 text-muted-foreground">{notification.body}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(notification.created_at)}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={async () => {
          if (!(await confirm({ title: "¿Borrar esta notificación?", destructive: true }))) return;
          startTransition(async () => {
            const result = await deleteNotification(notification.id);
            if (result?.error) toast.error(result.error);
          });
        }}
      >
        Borrar
      </Button>
    </div>
  );
}
