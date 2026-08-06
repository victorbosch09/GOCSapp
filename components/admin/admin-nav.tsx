"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const GROUPS: { label: string; links: { href: string; label: string }[] }[] = [
  {
    label: "General",
    links: [{ href: "/admin", label: "Resumen" }],
  },
  {
    label: "Roster",
    links: [
      { href: "/admin/soldados", label: "Soldados" },
      { href: "/admin/rangos", label: "Rangos" },
      { href: "/admin/sanciones", label: "Sanciones" },
      { href: "/admin/recompensas", label: "Recompensas" },
    ],
  },
  {
    label: "Economía",
    links: [
      { href: "/admin/tesoreria", label: "Tesorería" },
      { href: "/admin/catalogo", label: "Catálogo" },
      { href: "/admin/movimientos", label: "Movimientos" },
      { href: "/admin/contratos", label: "Contratos" },
      { href: "/admin/nomina", label: "Nómina" },
    ],
  },
  {
    label: "Operaciones",
    links: [
      { href: "/admin/calendario", label: "Calendario" },
      { href: "/admin/asistencia", label: "Asistencia" },
      { href: "/admin/notificaciones", label: "Notificaciones" },
    ],
  },
  {
    label: "Entrenamiento",
    links: [{ href: "/admin/entrenamiento", label: "Entrenamiento" }],
  },
];

const INSTRUCTOR_LINKS = ["/admin/entrenamiento"];

export function AdminNav({ instructorOnly = false }: { instructorOnly?: boolean }) {
  const pathname = usePathname();
  const groups = instructorOnly
    ? GROUPS.map((g) => ({ ...g, links: g.links.filter((l) => INSTRUCTOR_LINKS.includes(l.href)) })).filter(
        (g) => g.links.length > 0
      )
    : GROUPS;

  return (
    <nav className="flex shrink-0 flex-col gap-4 overflow-x-auto lg:w-48 lg:overflow-visible">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            {group.label}
          </p>
          {group.links.map((link) => {
            const active =
              link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-primary/15 text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
