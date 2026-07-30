"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/soldados", label: "Soldados" },
  { href: "/admin/rangos", label: "Rangos" },
  { href: "/admin/catalogo", label: "Catálogo" },
  { href: "/admin/movimientos", label: "Movimientos" },
  { href: "/admin/contratos", label: "Contratos" },
  { href: "/admin/sanciones", label: "Sanciones" },
  { href: "/admin/recompensas", label: "Recompensas" },
  { href: "/admin/notificaciones", label: "Notificaciones" },
  { href: "/admin/asistencia", label: "Asistencia" },
  { href: "/admin/entrenamiento", label: "Entrenamiento" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/nomina", label: "Nómina" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
      {LINKS.map((link) => {
        const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
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
    </nav>
  );
}
