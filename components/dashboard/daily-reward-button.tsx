"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { claimDailyReward } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";

export function DailyRewardButton({
  alreadyClaimed,
  currentStreak,
}: {
  alreadyClaimed: boolean;
  currentStreak: number;
}) {
  const [claimed, setClaimed] = useState(alreadyClaimed);
  const [streak, setStreak] = useState(currentStreak);
  const [pending, startTransition] = useTransition();

  function handleClaim() {
    startTransition(async () => {
      const result = await claimDailyReward();
      if (result.error) {
        toast.error(result.error);
      } else {
        setClaimed(true);
        if (result.streak) setStreak(result.streak);
        toast.success(`+${result.credited} cr — Racha: ${result.streak} día${result.streak !== 1 ? "s" : ""}`, {
          description: result.streak === 7 ? "¡Bonus de lealtad desbloqueado!" : result.streak === 30 ? "¡Bonus elite activado!" : undefined,
        });
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Racha diaria</span>
        <span className="stat-number text-foreground">{streak}<span className="text-sm font-normal text-muted-foreground ml-1">días</span></span>
      </div>
      <Button
        onClick={handleClaim}
        disabled={claimed || pending}
        size="sm"
        className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {pending ? "Reclamando…" : claimed ? "✓ Reclamado" : "+50 cr"}
      </Button>
    </div>
  );
}
