"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { GocsWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Portal" },
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

  const links = isCommandStaff ? [...LINKS, { href: "/admin", label: "Mando" }] : LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-gocs-carbon/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <GocsWordmark />
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-md px-3 py-1.5 font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                pathname.startsWith(link.href) &&
                  "bg-primary/15 text-foreground"
              )}
            >
              {link.label}
              {link.href === "/dashboard" && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gocs-red px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <form action={logout}>
          <Button type="submit" variant="ghost" size="sm">
            Salir
          </Button>
        </form>
      </div>
    </header>
  );
}
