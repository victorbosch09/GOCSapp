import type { Metadata } from "next";
import { getAllBuddyTeams } from "@/lib/data/buddy";
import { BuddyAdminPanel } from "@/components/admin/buddy-admin-panel";

export const metadata: Metadata = { title: "Buddy System — Mando G.O.C.S." };

export default async function AdminBuddySystemPage() {
  const teams = await getAllBuddyTeams();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Buddy System</h1>
        <p className="text-muted-foreground">
          Otorgá puntos y bonos a los tríos, y graduá a los que ya estén listos. El ascenso de rango
          del aspirante se hace a mano en /admin/soldados, como cualquier cambio de rango.
        </p>
      </div>
      <BuddyAdminPanel teams={teams} />
    </div>
  );
}
