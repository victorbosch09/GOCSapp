import Link from "next/link";
import { GocsWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-gocs-carbon/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <GocsWordmark />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/registro">Postularme</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        G.O.C.S. — Grupo Operacional Comando Sur · Comunidad hispana de Arma Reforger · Milsim
        Latinoamérica
      </footer>
    </div>
  );
}
