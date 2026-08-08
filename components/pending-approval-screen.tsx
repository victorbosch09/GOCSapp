import { GocsPatch } from "@/components/brand/logo";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { FounderClaimCard } from "@/components/dashboard/founder-claim-card";

export function PendingApprovalScreen({
  callsign,
  showFounderClaim,
}: {
  callsign: string;
  showFounderClaim: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gocs-carbon px-4 text-center">
      <GocsPatch size={72} />
      <div className="max-w-md">
        <h1 className="font-heading text-2xl">Proceso de admisión en curso</h1>
        <p className="mt-3 text-muted-foreground">
          {callsign}, tu postulación al G.O.C.S. está en revisión. La plana de mando debe aprobar
          tu ingreso antes de que puedas acceder al portal de operaciones.
        </p>
      </div>
      {showFounderClaim && (
        <div className="w-full max-w-md text-left">
          <FounderClaimCard />
        </div>
      )}
      <form action={logout}>
        <Button type="submit" variant="outline">
          Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
