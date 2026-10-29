"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { GocsWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Portal" },
  { href: "/perfil", label: "Mi Perfil" },
  { href: "/tienda", label: "Tienda" },
  { href: "/equipo", label: "Equipo" },
  { href: "/calendario", label: "Calendario" },
  { href: "/asistencia", label: "Asistencia" },
  { href: "/entrenamiento", label: "Entrenamiento" },
];

export function AppNav({
  isCommandStaff,
  unreadCount = 0,
}: {
  isCommandStaff: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = isCommandStaff ? [...LINKS, { href: "/admin", label: "Mando" }] : LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-gocs-carbon/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <GocsWordmark />

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-1 text-sm lg:flex">
          {links.map((link) => {
            const active = link.href === "/admin" ? pathname.startsWith("/admin") : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-md px-3 py-1.5 font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                  active && "bg-primary/15 text-foreground"
                )}
              >
                {link.label}
                {link.href === "/dashboard" && unreadCount > 0 && (
                  <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <form action={logout} className="hidden lg:block">
            <Button type="submit" variant="ghost" size="sm">Salir</Button>
          </form>
          {/* Hamburger */}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-md transition-colors hover:bg-muted lg:hidden"
          >
            <span className={cn("block h-0.5 w-5 bg-foreground transition-all duration-200", open && "translate-y-2 rotate-45")} />
            <span className={cn("block h-0.5 w-5 bg-foreground transition-all duration-200", open && "opacity-0")} />
            <span className={cn("block h-0.5 w-5 bg-foreground transition-all duration-200", open && "-translate-y-2 -rotate-45")} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-border/60 bg-gocs-carbon/98 lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {links.map((link) => {
              const active = link.href === "/admin" ? pathname.startsWith("/admin") : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    active && "bg-primary/15 text-foreground"
                  )}
                >
                  {link.label}
                  {link.href === "/dashboard" && unreadCount > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
            <form action={logout} className="mt-2 border-t border-border/40 pt-2">
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
                Cerrar sesión
              </Button>
            </form>
          </nav>
        </div>
      )}
    </header>
  );
}
