"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { rsvpEvent } from "@/lib/actions/events";
import { toast } from "sonner";
import type { RsvpResponse } from "@/types/database";

const OPTIONS: { value: RsvpResponse; label: string; active: string }[] = [
  { value: "asiste", label: "✅ Voy", active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  { value: "tal_vez", label: "🤔 Tal vez", active: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  { value: "no_asiste", label: "❌ No voy", active: "bg-destructive/20 text-destructive border-destructive/40" },
];

export function RsvpButtons({
  eventId,
  current,
}: {
  eventId: string;
  current: RsvpResponse | null;
}) {
  const [pending, startTransition] = useTransition();

  function handleRsvp(response: RsvpResponse) {
    startTransition(async () => {
      const result = await rsvpEvent(eventId, response);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Respuesta guardada.");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => handleRsvp(opt.value)}
          className={current === opt.value ? opt.active : undefined}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
