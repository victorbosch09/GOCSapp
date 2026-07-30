"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createQuiz, deleteQuiz } from "@/lib/actions/quiz";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Quiz, Skill } from "@/types/database";

type DraftQuestion = { question: string; options: string[]; correctIndex: number };
type QuizWithMeta = Quiz & { skill: { name: string } | null; questions: { id: string }[] };

function emptyQuestion(): DraftQuestion {
  return { question: "", options: ["", "", "", ""], correctIndex: 0 };
}

export function QuizBuilder({ skills, quizzes }: { skills: Skill[]; quizzes: QuizWithMeta[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillId, setSkillId] = useState<string>("none");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [pending, startTransition] = useTransition();

  function updateQuestion(i: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) } : q
      )
    );
  }

  function submit() {
    startTransition(async () => {
      const result = await createQuiz({
        title,
        description,
        skillId: skillId === "none" ? null : skillId,
        questions,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Quiz creado.");
        setTitle("");
        setDescription("");
        setSkillId("none");
        setQuestions([emptyQuestion()]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block">Título del quiz</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="mb-2 block">Habilidad/módulo vinculado (opcional)</Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin vincular</SelectItem>
                {skills.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="mb-2 block">Descripción (opcional)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Pregunta {qi + 1}</Label>
              {questions.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== qi))}
                >
                  Quitar
                </Button>
              )}
            </div>
            <Input
              value={q.question}
              onChange={(e) => updateQuestion(qi, { question: e.target.value })}
              placeholder="Texto de la pregunta"
            />
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={q.correctIndex === oi}
                  onChange={() => updateQuestion(qi, { correctIndex: oi })}
                  title="Marcar como respuesta correcta"
                />
                <Input
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  placeholder={`Opción ${oi + 1}`}
                  className="h-8"
                />
              </div>
            ))}
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
          >
            + Agregar pregunta
          </Button>
          <Button size="sm" disabled={pending} onClick={submit}>
            {pending ? "Creando..." : "Crear quiz"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Quizzes existentes</p>
        {quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin quizzes creados.</p>
        ) : (
          quizzes.map((q) => <QuizRow key={q.id} quiz={q} />)
        )}
      </div>
    </div>
  );
}

function QuizRow({ quiz }: { quiz: QuizWithMeta }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3 text-sm">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{quiz.title}</span>
          {quiz.skill?.name && <Badge variant="secondary">{quiz.skill.name}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{quiz.questions.length} preguntas</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => {
          if (!confirm("¿Borrar este quiz? Se pierden sus preguntas.")) return;
          startTransition(async () => {
            const result = await deleteQuiz(quiz.id);
            if (result?.error) toast.error(result.error);
          });
        }}
      >
        Borrar
      </Button>
    </div>
  );
}
