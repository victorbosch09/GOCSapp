import type { Metadata } from "next";
import { getAuditLog } from "@/lib/data/admin";
import { requireCommandStaff } from "@/lib/data/profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AuditLogTable } from "@/components/admin/audit-log-table";

export const metadata: Metadata = { title: "Auditoría — Mando G.O.C.S." };

export default async function AdminAuditoriaPage() {
  await requireCommandStaff();
  const entries = await getAuditLog(500);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Auditoría</h1>
        <p className="text-muted-foreground">
          Últimas {entries.length} acciones sensibles del mando: cambios de rango de mando, ajustes
          manuales, ediciones y borrados de movimientos, borrado de cuentas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Registro completo</CardTitle>
          <CardDescription>Buscá por operador o filtrá por tipo de acción.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable entries={entries} />
        </CardContent>
      </Card>
    </div>
  );
}
