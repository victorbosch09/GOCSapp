"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteContract } from "@/lib/actions/admin";
import { useConfirm } from "@/components/ui/confirm-provider";
import { downloadCsv } from "@/lib/csv";
import { formatCredits, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Contract } from "@/types/database";

type ContractWithProfile = Contract & { profile?: { callsign: string } | null };

export function ContractList({ contracts }: { contracts: ContractWithProfile[] }) {
  if (contracts.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin contratos cargados todavía.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        size="sm"
        variant="outline"
        className="self-end"
        onClick={() =>
          downloadCsv(
            `gocs-contratos-${new Date().toISOString().slice(0, 10)}.csv`,
            contracts.map((c) => ({
              fecha: c.contract_date,
              soldado: c.profile?.callsign ?? "",
              nivel_riesgo: c.risk_level ?? "",
              total: c.total_amount,
              notas: c.notes ?? "",
            }))
          )
        }
      >
        Exportar CSV ({contracts.length})
      </Button>
      {contracts.map((c) => (
        <ContractRow key={c.id} contract={c} />
      ))}
    </div>
  );
}

function ContractRow({ contract }: { contract: ContractWithProfile }) {
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{contract.profile?.callsign ?? "—"}</span>
          {contract.risk_level && <Badge variant="outline">Nivel {contract.risk_level}</Badge>}
          {Array.isArray(contract.bonuses) &&
            (contract.bonuses as string[]).map((b) => (
              <Badge key={b} variant="secondary">
                {b}
              </Badge>
            ))}
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(contract.contract_date)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-medium text-emerald-400">+{formatCredits(contract.total_amount)}</span>
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={async () => {
            if (
              !(await confirm({
                title: "¿Borrar este contrato?",
                description: "También se revierte el bono en el saldo.",
                destructive: true,
              }))
            )
              return;
            startTransition(async () => {
              const result = await deleteContract(contract.id);
              if (result?.error) toast.error(result.error);
            });
          }}
        >
          Borrar
        </Button>
      </div>
    </div>
  );
}
