import type { Metadata } from "next";
import { getAllProfiles } from "@/lib/data/admin";
import { getSkills, getAllEvaluations, getTrainingMaterials } from "@/lib/data/training";
import { getQuizzes } from "@/lib/data/quiz";
import { TrainingPanel } from "@/components/admin/training-panel";
import { QuizBuilder } from "@/components/admin/quiz-builder";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Entrenamiento — Mando G.O.C.S." };

export default async function AdminEntrenamientoPage() {
  const [profiles, skills, evaluations, materials, quizzes] = await Promise.all([
    getAllProfiles(),
    getSkills(),
    getAllEvaluations(),
    getTrainingMaterials(),
    getQuizzes(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl">Entrenamiento</h1>
        <p className="text-muted-foreground">
          Evaluaciones, catálogo de habilidades/módulos, quizzes y material de estudio del clan.
        </p>
      </div>
      <TrainingPanel
        profiles={profiles.filter((p) => p.approved)}
        skills={skills}
        evaluations={evaluations}
        materials={materials}
      />
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base">Quizzes</CardTitle>
          <CardDescription>
            El puntaje del operador se suma automáticamente a su hoja de vida (≥70% = aprobado).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuizBuilder skills={skills} quizzes={quizzes} />
        </CardContent>
      </Card>
    </div>
  );
}
