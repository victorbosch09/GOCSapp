"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateReward, deleteReward } from "@/lib/actions/admin";
import { useConfirm } from "@/components/ui/confirm-provider";
import { formatCredits, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Reward } from "@/types/database";

type RewardWithProfile = Reward & { profile?: { callsign: string } | null };

export function RewardList({ rewards }: { rewards: RewardWithProfile[] }) {
  if (rewards.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin recompensas entregadas todavía.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rewards.map((r) => (
        <RewardRow key={r.id} reward={r} />
      ))}
    </div>
  );
}

function RewardRow({ reward }: { reward: RewardWithProfile }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(reward.title);
  const [description, setDescription] = useState(reward.description ?? "");
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3 text-sm">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
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
                const result = await updateReward(reward.id, { title, description });
                if (result?.error) toast.error(result.error);
                else {
                  toast.success("Recompensa actualizada.");
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

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div className="min-w-0">
        <p className="font-medium">
          {reward.title}
          {reward.amount ? ` · ${formatCredits(reward.amount)}` : ""}
        </p>
        <p className="text-muted-foreground">
          {reward.profile?.callsign ?? "—"} · {formatDateTime(reward.awarded_at)}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
          Editar
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={async () => {
            if (
              !(await confirm({
                title: "¿Borrar esta recompensa?",
                description: "Si tenía créditos asociados, también se revierte el saldo.",
                destructive: true,
              }))
            )
              return;
            startTransition(async () => {
              const result = await deleteReward(reward.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          Borrar
        </Button>
      </div>
    </div>
  );
}
