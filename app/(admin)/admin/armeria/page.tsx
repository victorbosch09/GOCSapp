import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { WeaponRentalsPanel } from "@/components/admin/weapon-rentals-panel";

export const metadata: Metadata = { title: "Armería — Mando G.O.C.S." };

export default async function AdminArmeriaPage() {
  const admin = createAdminClient();

  const [rentalsRes, profilesRes] = await Promise.all([
    admin
      .from("weapon_rentals" as never)
      .select(
        "*, borrower:profiles!weapon_rentals_profile_id_fkey(callsign), lender:profiles!weapon_rentals_lent_by_id_fkey(callsign)"
      )
      .order("rented_at", { ascending: false }),
    admin.from("profiles").select("id, callsign").eq("approved", true).order("callsign"),
  ]);

  let migrationPending = false;
  if (rentalsRes.error?.message?.includes("does not exist") || rentalsRes.error?.message?.includes("schema cache")) {
    migrationPending = true;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Armería — Rentas de Equipo</h1>
        <p className="text-muted-foreground text-sm">
          Registro de armamento, vehículos y equipo prestado a operadores. Cada renta tiene fecha de vencimiento.
        </p>
      </div>

      {migrationPending && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-400">
          <strong className="font-semibold">Migración pendiente.</strong> La tabla{" "}
          <code className="font-mono text-xs">weapon_rentals</code> no existe aún. Ejecutá{" "}
          <code className="font-mono text-xs">supabase/migrations/20260101000042_insurance_rentals_multipliers.sql</code>{" "}
          en el SQL Editor de Supabase para habilitar esta sección.
        </div>
      )}

      {!migrationPending && (
        <WeaponRentalsPanel
          rentals={(rentalsRes.data ?? []) as never}
          profiles={profilesRes.data ?? []}
        />
      )}
    </div>
  );
}
