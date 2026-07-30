"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendNotification } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { NotificationTarget, Profile } from "@/types/database";

export function NotificationForm({ profiles, squads }: { profiles: Profile[]; squads: string[] }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetType, setTargetType] = useState<NotificationTarget>("all");
  const [targetId, setTargetId] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await sendNotification({ title, body, targetType, targetId: targetId || null });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Notificación enviada.");
        setTitle("");
        setBody("");
        setTargetId("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="mb-2 block">Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label className="mb-2 block">Mensaje</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="mb-2 block">Destinatario</Label>
          <Select
            value={targetType}
            onValueChange={(v) => {
              setTargetType(v as NotificationTarget);
              setTargetId("");
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="squad">Una escuadra</SelectItem>
              <SelectItem value="profile">Un soldado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {targetType === "profile" && (
          <div>
            <Label className="mb-2 block">Soldado</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Elegir soldado" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.callsign}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {targetType === "squad" && (
          <div>
            <Label className="mb-2 block">Escuadra</Label>
            {squads.length > 0 ? (
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elegir escuadra" />
                </SelectTrigger>
                <SelectContent>
                  {squads.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Nombre de escuadra"
              />
            )}
          </div>
        )}
      </div>
      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? "Enviando..." : "Enviar notificación"}
      </Button>
    </div>
  );
}
