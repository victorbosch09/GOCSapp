"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { approveProfile } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function ApproveButton({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await approveProfile(profileId);
          if (result?.error) toast.error(result.error);
          else toast.success("Ingreso aprobado.");
        })
      }
    >
      {pending ? "Aprobando..." : "Aprobar ingreso"}
    </Button>
  );
}
