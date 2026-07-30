"use client";

import { useEffect } from "react";
import { GocsPatch } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gocs-carbon px-4 text-center">
      <GocsPatch size={64} />
      <div>
        <p className="font-heading text-4xl text-gocs-red">FALLA</p>
        <h1 className="mt-2 font-heading text-xl">Algo salió mal en la operación</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          El equipo técnico fue notificado. Podés reintentar o volver al portal.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-muted-foreground/60">Ref: {error.digest}</p>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button asChild>
          <a href="/dashboard">Volver al portal</a>
        </Button>
      </div>
    </div>
  );
}
