"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { GocsWordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  Users,
  Calendar,
  CheckSquare,
  BookOpen,
  GraduationCap,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Portal",        icon: LayoutDashboard },
  { href: "/perfil",        label: "Mi Perfil",     icon: User },
  { href: "/tienda",        label: "Tienda",        icon: ShoppingBag },
  { href: "/equipo",        label: "Equipo",        icon: Users },
  { href: "/calendario",   label: "Calendario",    icon: Calendar },
  { href: "/asistencia",   label: "Asistencia",    icon: CheckSquare },
  { href: "/entrenamiento", label: "Entrenamiento", icon: GraduationCap },
  { href: "/manual",        label: "Manual",        icon: BookOpen },
];

const BOTTOM_TABS = [
  { href: "/dashboard",    label: "Portal",    icon: LayoutDashboard },
  { href: "/equipo",       label: "Equipo",    icon: Users },
  { href: "/entrenamiento",label: "Training",  icon: GraduationCap },
  { href: "/tienda",       label: "Tienda",    icon: ShoppingBag },
  { href: "/perfil",       label: "Perfil",    icon: User },
];

export function AppNav({
  isCommandStaff,
  unreadCount = 0,
}: {
  isCommandStaff: boolean;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allItems = isCommandStaff
    ? [...NAV_ITEMS, { href: "/admin", label: "Mando", icon: Shield }]
    : NAV_ITEMS;

  const bottomItems = isCommandStaff
    ? [...BOTTOM_TABS, { href: "/admin", label: "Mando", icon: Shield }]
    : BOTTOM_TABS;

  function isActive(href: string) {
    if (href === "/admin") return pathname.startsWith("/admin");
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ─────────── DESKTOP SIDEBAR ─────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-56 bg-gocs-carbon border-r border-white/6 z-40 print:hidden">
        {/* Logo */}
        <div className="flex items-center h-16 px-5 border-b border-white/6 shrink-0">
          <GocsWordmark />
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5">
          {allItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/20 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon
                  size={16}
                  className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground/70")}
                />
                <span>{item.label}</span>
                {item.href === "/dashboard" && unreadCount > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/6 p-3">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              <LogOut size={16} className="shrink-0 text-muted-foreground/70" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ─────────── MOBILE TOP BAR ─────────── */}
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between h-14 px-4 bg-gocs-carbon/95 backdrop-blur border-b border-white/6 print:hidden">
        <GocsWordmark />
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile full-screen drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 bg-gocs-carbon/98 overflow-y-auto print:hidden">
          <nav className="flex flex-col gap-1 p-4">
            {allItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/20 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon
                    size={20}
                    className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground/60")}
                  />
                  <span className="text-base">{item.label}</span>
                  {active && <span className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-white/6 p-4">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-base font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                <LogOut size={20} className="shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────── MOBILE BOTTOM TAB BAR ─────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-gocs-carbon/95 backdrop-blur border-t border-white/6 pb-safe print:hidden">
        <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${bottomItems.length}, 1fr)` }}>
          {bottomItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  active ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                <Icon size={20} className={cn("shrink-0", active && "drop-shadow-[0_0_6px_oklch(0.52_0.20_25)]")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
