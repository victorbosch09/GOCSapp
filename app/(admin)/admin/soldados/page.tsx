import type { Metadata } from "next";
import { getAllProfiles, getRanks } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SoldadosTable } from "@/components/admin/soldados-table";

export const metadata: Metadata = { title: "Soldados — Mando G.O.C.S." };

export default async function AdminSoldadosPage() {
  const [profiles, ranks] = await Promise.all([getAllProfiles(), getRanks()]);

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
          <SoldadosTable profiles={profiles} ranks={ranks} />
        </CardContent>
      </Card>
    </div>
  );
}
