import type { Metadata } from "next";
import { getAllProfiles, getRanks, getAuditLog } from "@/lib/data/admin";
import { requireCommandStaff } from "@/lib/data/profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SoldadosTable } from "@/components/admin/soldados-table";
import { AuditLog } from "@/components/admin/audit-log";

export const metadata: Metadata = { title: "Soldados — Mando G.O.C.S." };

export default async function AdminSoldadosPage() {
  const [me, profiles, ranks, audit] = await Promise.all([
    requireCommandStaff(),
    getAllProfiles(),
    getRanks(),
    getAuditLog(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Soldados</h1>
        <p className="text-muted-foreground">
          Vista global: rango, escuadra, saldo y estado de aprobación.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Roster completo</CardTitle>
          <CardDescription>{profiles.length} perfiles registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          <SoldadosTable profiles={profiles} ranks={ranks} currentProfileId={me.id} />
        </CardContent>
      </Card>
      <AuditLog entries={audit} />
    </div>
  );
}
