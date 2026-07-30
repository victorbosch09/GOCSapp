import type { Metadata } from "next";
import { getAllProfiles } from "@/lib/data/admin";
import { getSkills, getAllEvaluations, getTrainingMaterials } from "@/lib/data/training";
import { TrainingPanel } from "@/components/admin/training-panel";

export const metadata: Metadata = { title: "Entrenamiento — Mando G.O.C.S." };

export default async function AdminEntrenamientoPage() {
  const [profiles, skills, evaluations, materials] = await Promise.all([
    getAllProfiles(),
    getSkills(),
    getAllEvaluations(),
    getTrainingMaterials(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Entrenamiento</h1>
        <p className="text-muted-foreground">
          Evaluaciones, catálogo de habilidades/módulos y material de estudio del clan.
        </p>
      </div>
      <TrainingPanel
        profiles={profiles.filter((p) => p.approved)}
        skills={skills}
        evaluations={evaluations}
        materials={materials}
      />
    </div>
  );
}
