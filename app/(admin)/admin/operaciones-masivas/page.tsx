import type { Metadata } from "next";
import { getAllProfiles, getAllSkillsForAdmin } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BulkOpsPanel } from "@/components/admin/bulk-ops-panel";

export const metadata: Metadata = { title: "Operaciones en Lote — Mando G.O.C.S." };

export default async function AdminBulkOpsPage() {
  const [profiles, skills] = await Promise.all([getAllProfiles(), getAllSkillsForAdmin()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Operaciones en Lote</h1>
        <p className="text-muted-foreground">
          Seleccioná múltiples operadores y aplicá módulos, bonos, sanciones o recompensas de una sola vez.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Panel de operaciones</CardTitle>
          <CardDescription>
            Marcá los operadores en la tabla y configurá la operación a la derecha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkOpsPanel profiles={profiles} skills={skills} />
        </CardContent>
      </Card>
    </div>
  );
}
