"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { awardReward } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Profile } from "@/types/database";

export function RewardForm({ profiles }: { profiles: Profile[] }) {
  const [profileId, setProfileId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!profileId || !title.trim()) {
      toast.error("Falta el soldado o el título.");
      return;
    }
    startTransition(async () => {
      const result = await awardReward({
        profileId,
        title,
        description,
        amount: amount ? Number(amount) : null,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Recompensa entregada.");
        setProfileId("");
        setTitle("");
        setDescription("");
        setAmount("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Label className="mb-2 block">Soldado</Label>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar soldado" />
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
      <div>
        <Label className="mb-2 block">Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Operador del mes" />
      </div>
      <div>
        <Label className="mb-2 block">Descripción</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div>
        <Label className="mb-2 block">Créditos otorgados (opcional)</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-40" />
      </div>
      <Button onClick={submit} disabled={pending} className="self-start">
        {pending ? "Entregando..." : "Entregar recompensa"}
      </Button>
    </div>
  );
}
