"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type NavCommand = { label: string; href: string; keywords?: string };
type RosterHit = { id: string; callsign: string; rank_abbreviation: string | null };

const NAV_COMMANDS: NavCommand[] = [
  { label: "Portal", href: "/dashboard" },
  { label: "Tienda", href: "/tienda", keywords: "comprar armas equipo" },
  { label: "Equipo", href: "/equipo", keywords: "roster ranking" },
  { label: "Calendario", href: "/calendario", keywords: "eventos operaciones" },
  { label: "Asistencia", href: "/asistencia" },
  { label: "Entrenamiento", href: "/entrenamiento", keywords: "quiz hoja de vida" },
];

const ADMIN_COMMANDS: NavCommand[] = [
  { label: "Mando — Resumen", href: "/admin" },
  { label: "Mando — Soldados", href: "/admin/soldados" },
  { label: "Mando — Auditoría", href: "/admin/auditoria" },
  { label: "Mando — Rangos", href: "/admin/rangos" },
  { label: "Mando — Sanciones", href: "/admin/sanciones" },
  { label: "Mando — Recompensas", href: "/admin/recompensas" },
  { label: "Mando — Tesorería", href: "/admin/tesoreria" },
  { label: "Mando — Catálogo", href: "/admin/catalogo" },
  { label: "Mando — Movimientos", href: "/admin/movimientos" },
  { label: "Mando — Contratos", href: "/admin/contratos" },
  { label: "Mando — Nómina", href: "/admin/nomina" },
  { label: "Mando — Calendario", href: "/admin/calendario" },
  { label: "Mando — Asistencia", href: "/admin/asistencia" },
  { label: "Mando — Notificaciones", href: "/admin/notificaciones" },
  { label: "Mando — Entrenamiento", href: "/admin/entrenamiento" },
];

export function CommandPalette({ isCommandStaff = false }: { isCommandStaff?: boolean }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [roster, setRoster] = useState<RosterHit[] | null>(null);
  const router = useRouter();

  const loadRoster = useCallback(() => {
    if (roster !== null) return;
    createClient()
      .from("roster_public")
      .select("id, callsign, rank_abbreviation")
      .then(({ data }) => setRoster(data ?? []));
  }, [roster]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) loadRoster();
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loadRoster]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) loadRoster();
    else setQuery("");
  }

  const q = query.trim().toLowerCase();
  const commands = isCommandStaff ? [...NAV_COMMANDS, ...ADMIN_COMMANDS] : NAV_COMMANDS;
  const matchedCommands = q
    ? commands.filter(
        (c) => c.label.toLowerCase().includes(q) || c.keywords?.toLowerCase().includes(q)
      )
    : commands;
  const matchedRoster = q
    ? (roster ?? []).filter((r) => r.callsign.toLowerCase().includes(q)).slice(0, 8)
    : [];

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Buscador rápido</DialogTitle>
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar página u operador..."
          className="h-12 rounded-none border-0 border-b border-border/60 focus-visible:ring-0"
        />
        <div className="max-h-80 overflow-y-auto p-2">
          {matchedCommands.length === 0 && matchedRoster.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">Sin resultados.</p>
          )}
          {matchedCommands.map((c) => (
            <button
              key={c.href}
              type="button"
              onClick={() => go(c.href)}
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {c.label}
            </button>
          ))}
          {matchedRoster.length > 0 && (
            <>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                Operadores
              </p>
              {matchedRoster.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => go(isCommandStaff ? `/admin/soldados/${r.id}` : "/equipo")}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {r.rank_abbreviation && (
                    <span className="text-xs text-muted-foreground">{r.rank_abbreviation}</span>
                  )}
                  {r.callsign}
                </button>
              ))}
            </>
          )}
        </div>
        <p className="border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
          Ctrl/Cmd+K para abrir o cerrar
        </p>
      </DialogContent>
    </Dialog>
  );
}
