"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createEvent } from "@/lib/actions/events";
import { Plus } from "lucide-react";
import { toast } from "sonner";

type Operator = { id: string; callsign: string };

export function CreateEventForm({ instructors }: { instructors: Operator[] }) {
  const [open, setOpen] = useState(false);
  const [requiresSignup, setRequiresSignup] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await createEvent({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      event_type: formData.get("event_type") as "entrenamiento" | "operacion" | "pago" | "otro",
      start_at: formData.get("start_at") as string,
      end_at: formData.get("end_at") as string,
      instructor_id: formData.get("instructor_id") as string,
      max_participants: formData.get("max_participants") as string,
      requires_signup: requiresSignup,
    });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Evento creado y notificado a Discord.");
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Crear evento</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-title">Título *</Label>
            <Input id="ev-title" name="title" placeholder="Ej: Entrenamiento CQB — Escuadra Alfa" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-type">Tipo *</Label>
              <Select name="event_type" defaultValue="entrenamiento">
                <SelectTrigger id="ev-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrenamiento">Entrenamiento</SelectItem>
                  <SelectItem value="operacion">Operación</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-instructor">Instructor</Label>
              <Select name="instructor_id" defaultValue="">
                <SelectTrigger id="ev-instructor">
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {instructors.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.callsign}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-start">Inicio *</Label>
              <Input id="ev-start" name="start_at" type="datetime-local" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-end">Fin</Label>
              <Input id="ev-end" name="end_at" type="datetime-local" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ev-desc">Descripción</Label>
            <Textarea id="ev-desc" name="description" rows={2} placeholder="Detalles del evento, requisitos, ubicación en el mapa..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ev-max">Cupo máximo</Label>
              <Input id="ev-max" name="max_participants" type="number" min="1" placeholder="Sin límite" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch
                id="ev-signup"
                checked={requiresSignup}
                onCheckedChange={setRequiresSignup}
              />
              <Label htmlFor="ev-signup" className="cursor-pointer">Requiere inscripción</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Crear y notificar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
