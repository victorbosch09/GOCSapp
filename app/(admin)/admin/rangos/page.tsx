import type { Metadata } from "next";
import { getRanks } from "@/lib/data/admin";
import { RankEditor } from "@/components/admin/rank-editor";

export const metadata: Metadata = { title: "Rangos — Mando G.O.C.S." };

export default async function AdminRangosPage() {
  const ranks = await getRanks();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Rangos</h1>
        <p className="text-muted-foreground">
          Sueldo semanal, descripción y requisito de ascenso por rango. El nombre y la abreviatura
          no se editan acá para no romper referencias del historial.
        </p>
      </div>
      <RankEditor ranks={ranks} />
    </div>
  );
}
