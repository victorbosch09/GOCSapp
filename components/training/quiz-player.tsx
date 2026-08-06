"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { submitQuizAttempt } from "@/lib/actions/quiz";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCredits } from "@/lib/format";
import type { Quiz, QuizAttempt, QuizDifficulty, QuizQuestion } from "@/types/database";

type QuizWithMeta = Quiz & { skill: { name: string } | null; questions: { id: string }[] };

const DIFFICULTY_LABEL: Record<QuizDifficulty, string> = {
  facil: "Fácil",
  media: "Media",
  dificil: "Difícil",
};

const DIFFICULTY_BADGE: Record<QuizDifficulty, string> = {
  facil: "bg-emerald-500/15 text-emerald-400",
  media: "bg-amber-500/15 text-amber-400",
  dificil: "bg-destructive/15 text-destructive",
};

export function QuizList({ quizzes, attempts }: { quizzes: QuizWithMeta[]; attempts: QuizAttempt[] }) {
  const [activeQuiz, setActiveQuiz] = useState<QuizWithMeta | null>(null);
  const attemptByQuiz = new Map(attempts.map((a) => [a.quiz_id, a]));

  if (quizzes.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay quizzes disponibles todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {quizzes.map((q) => {
        const done = attemptByQuiz.get(q.id);
        return (
          <Card key={q.id}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{q.title}</p>
                  <Badge className={DIFFICULTY_BADGE[q.difficulty]} variant="secondary">
                    {DIFFICULTY_LABEL[q.difficulty]}
                  </Badge>
                  {q.skill?.name && <Badge variant="secondary">{q.skill.name}</Badge>}
                  {done && (
                    <Badge
                      className={
                        done.score / done.total >= 0.7
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-destructive/15 text-destructive"
                      }
                      variant="secondary"
                    >
                      Ya rendido — {done.score}/{done.total}
                    </Badge>
                  )}
                </div>
                {q.description && <p className="text-sm text-muted-foreground">{q.description}</p>}
                {!done && (
                  <p className="text-xs text-muted-foreground">
                    {q.questions.length} preguntas · Aprobar (≥70%) da +{formatCredits(1000)} — un
                    solo intento
                  </p>
                )}
              </div>
              <Button size="sm" onClick={() => setActiveQuiz(q)} disabled={!!done} title={done ? "Ya rendiste este quiz — no se puede repetir" : undefined}>
                {done ? "Rendido" : "Hacer quiz"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
      {activeQuiz && (
        <QuizPlayerModal
          quizId={activeQuiz.id}
          title={activeQuiz.title}
          onClose={() => setActiveQuiz(null)}
        />
      )}
    </div>
  );
}

function QuizPlayerModal({
  quizId,
  title,
  onClose,
}: {
  quizId: string;
  title: string;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{
    score: number;
    total: number;
    passed: boolean;
    bonusAwarded: boolean;
    bonusAmount: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("sort_order")
      .then(({ data }) => setQuestions((data ?? []) as QuizQuestion[]));
  }, [quizId]);

  const allAnswered = questions ? questions.every((_, i) => answers[i] !== undefined) : false;

  function submit() {
    if (!questions) return;
    startTransition(async () => {
      const orderedAnswers = questions.map((_, i) => answers[i]);
      const res = await submitQuizAttempt(quizId, orderedAnswers);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.data) {
        setResult({
          score: res.data.score,
          total: res.data.total,
          passed: res.data.passed,
          bonusAwarded: res.data.bonus_awarded,
          bonusAmount: res.data.bonus_amount,
        });
        if (res.data.bonus_awarded) {
          toast.success(`¡Aprobado! +${res.data.bonus_amount} créditos acreditados.`);
        }
      }
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading">{title}</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-4xl">{result.passed ? "🏅" : "📋"}</p>
            <p className="font-heading text-3xl text-gocs-red">
              {result.score}/{result.total}
            </p>
            <p className="text-muted-foreground">
              {Math.round((result.score / result.total) * 100)}% de aciertos —{" "}
              {result.passed ? "Aprobado" : "No aprobado"}
            </p>
            {result.bonusAwarded && (
              <p className="font-heading text-lg text-emerald-400">
                +{formatCredits(result.bonusAmount)} acreditados
              </p>
            )}
            {result.passed && !result.bonusAwarded && (
              <p className="text-xs text-muted-foreground">
                Ya habías aprobado este quiz antes — el bono solo se otorga la primera vez.
              </p>
            )}
            <Button onClick={onClose}>Cerrar</Button>
          </div>
        ) : questions === null ? (
          <p className="text-sm text-muted-foreground">Cargando preguntas...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((q, qi) => {
              const options = q.options as string[];
              return (
                <div key={q.id} className="rounded-md border border-border/60 p-3">
                  <p className="mb-2 text-sm font-medium">
                    {qi + 1}. {q.question}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {options.map((opt, oi) => (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                        className={cn(
                          "rounded-md border px-3 py-2 text-left text-sm transition-colors",
                          answers[qi] === oi
                            ? "border-gocs-red bg-primary/10"
                            : "border-border/60 hover:bg-muted/40"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            <DialogFooter>
              <Button disabled={!allAnswered || pending} onClick={submit}>
                {pending ? "Enviando..." : "Entregar quiz"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
