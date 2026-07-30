"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createEvent, deleteEvent } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event, EventType } from "@/types/database";

const TYPES: { value: EventType; label: string }[] = [
  { value: "entrenamiento", label: "Entrenamiento" },
  { value: "operacion", label: "Operación" },
  { value: "pago", label: "Pago" },
  { value: "otro", label: "Otro" },
];

export function EventAdmin({ events }: { events: Event[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("entrenamiento");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [pending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function submit() {
    if (!title.trim() || !startAt) {
      toast.error("Falta el título o la fecha de inicio.");
      return;
    }
    startTransition(async () => {
      const result = await createEvent({ title, description, eventType, startAt, endAt: endAt || null });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Evento creado.");
        setTitle("");
        setDescription("");
        setStartAt("");
        setEndAt("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Tipo</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Inicio</Label>
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Fin (opcional)</Label>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Descripción</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <Button onClick={submit} disabled={pending} className="self-start">
          {pending ? "Creando..." : "Crear evento"}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{event.title}</p>
                <Badge variant="secondary">{event.event_type}</Badge>
              </div>
              <p className="text-muted-foreground">{formatDateTime(event.start_at)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={deletingId === event.id}
              onClick={() => {
                setDeletingId(event.id);
                startTransition(async () => {
                  const result = await deleteEvent(event.id);
                  if (result?.error) toast.error(result.error);
                  setDeletingId(null);
                });
              }}
            >
              Eliminar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
