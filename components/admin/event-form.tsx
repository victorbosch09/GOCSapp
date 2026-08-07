"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createEvent, updateEvent, deleteEvent } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { downloadIcsEvent } from "@/lib/ics";
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

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventAdmin({ events }: { events: Event[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventType, setEventType] = useState<EventType>("entrenamiento");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [pending, startTransition] = useTransition();

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
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [eventType, setEventType] = useState<EventType>(event.event_type);
  const [startAt, setStartAt] = useState(toLocalInput(event.start_at));
  const [endAt, setEndAt] = useState(event.end_at ? toLocalInput(event.end_at) : "");
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-border/60 p-3 text-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await updateEvent(event.id, {
                  title,
                  description,
                  eventType,
                  startAt,
                  endAt: endAt || null,
                });
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Evento actualizado.");
                  setEditing(false);
                }
              })
            }
          >
            Guardar
          </Button>
        </div>
      </div>
    );
  }

  const isPast = new Date(event.start_at).getTime() < Date.now();

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm ${
        isPast ? "opacity-60" : ""
      }`}
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{event.title}</p>
          <Badge variant="secondary">{event.event_type}</Badge>
          {isPast ? <Badge variant="outline">Pasado</Badge> : <Badge variant="outline">Próximo</Badge>}
        </div>
        <p className="text-muted-foreground">{formatDateTime(event.start_at)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" onClick={() => downloadIcsEvent(event)}>
          .ics
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm("¿Borrar este evento?")) return;
            startTransition(async () => {
              const result = await deleteEvent(event.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}
