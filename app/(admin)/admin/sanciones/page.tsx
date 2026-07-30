import type { Metadata } from "next";
import { getAllProfiles, getSanctionTypes, getRecentSanctions } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SanctionForm } from "@/components/admin/sanction-form";
import { SanctionList } from "@/components/admin/sanction-list";

export const metadata: Metadata = { title: "Sanciones — Mando G.O.C.S." };

export default async function AdminSancionesPage() {
  const [profiles, sanctionTypes, recent] = await Promise.all([
    getAllProfiles(),
    getSanctionTypes(),
    getRecentSanctions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Sanciones</h1>
        <p className="text-muted-foreground">
          Catálogo de faltas del clan (leve → extrema) y descuento opcional en créditos.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Aplicar sanción</CardTitle>
          <CardDescription>Queda registrada en el historial del soldado.</CardDescription>
        </CardHeader>
        <CardContent>
          <SanctionForm profiles={profiles.filter((p) => p.approved)} sanctionTypes={sanctionTypes} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Sanciones aplicadas</CardTitle>
          <CardDescription>Editables y borrables por si hay un error de carga.</CardDescription>
        </CardHeader>
        <CardContent>
          <SanctionList sanctions={recent} />
        </CardContent>
      </Card>
    </div>
  );
}
