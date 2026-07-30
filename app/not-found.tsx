import Link from "next/link";
import { GocsPatch } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gocs-carbon px-4 text-center">
      <GocsPatch size={64} />
      <div>
        <p className="font-heading text-6xl text-gocs-red">404</p>
        <h1 className="mt-2 font-heading text-xl">Objetivo no localizado</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Esta ruta no existe o fue reubicada. Verificá la coordenada e intentá de nuevo.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Volver al portal</Link>
      </Button>
    </div>
  );
}
