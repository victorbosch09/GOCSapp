import type { Metadata } from "next";
import { getAllProfiles, getContractBonusTypes, getContractRiskLevels } from "@/lib/data/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ContractForm } from "@/components/admin/contract-form";

export const metadata: Metadata = { title: "Contratos — Mando G.O.C.S." };

export default async function AdminContratosPage() {
  const [profiles, bonusTypes, riskLevels] = await Promise.all([
    getAllProfiles(),
    getContractBonusTypes(),
    getContractRiskLevels(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Pago por contrato</h1>
        <p className="text-muted-foreground">
          Marcá los logros del contrato — el nivel de riesgo queda como dato de registro, sin
          multiplicador automático.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Nuevo contrato</CardTitle>
          <CardDescription>Genera un bono por soldado seleccionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <ContractForm
            profiles={profiles.filter((p) => p.approved)}
            bonusTypes={bonusTypes}
            riskLevels={riskLevels}
          />
        </CardContent>
      </Card>
    </div>
  );
}
