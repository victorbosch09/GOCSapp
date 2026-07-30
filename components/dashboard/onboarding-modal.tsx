"use client";

import { useState, useTransition } from "react";
import { markOnboarded } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GocsPatch } from "@/components/brand/logo";

const STEPS = [
  {
    title: "Bienvenido al portal del G.O.C.S.",
    body: "Este es tu portal de operador. Acá vas a ver tu rango, tu saldo en créditos y todo tu historial — de un vistazo.",
  },
  {
    title: "Tienda e inventario",
    body: "En Tienda comprás armamento y equipo con tus créditos. Todo lo que comprás queda en tu inventario (acá en el portal) y podés revenderlo si cambiás de idea.",
  },
  {
    title: "Asistencia y Entrenamiento",
    body: "Respondé tu asistencia a entrenamientos y operaciones en Asistencia — condiciona tu sueldo semanal. En Entrenamiento vas armando tu hoja de vida con evaluaciones y podés estudiar el material del clan.",
  },
  {
    title: "Equipo",
    body: "Ahí ves las estadísticas generales del clan: escalafón, preparación por módulo, y quiénes se destacaron el último mes. Los saldos de otros soldados siempre son privados.",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [, startTransition] = useTransition();

  function finish() {
    setOpen(false);
    startTransition(() => {
      void markOnboarded();
    });
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && finish()}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-2 flex justify-center">
            <GocsPatch size={56} />
          </div>
          <DialogTitle className="text-center font-heading">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.body}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-6 rounded-full ${i === step ? "bg-gocs-red" : "bg-muted"}`}
            />
          ))}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" size="sm" onClick={finish}>
            Saltar
          </Button>
          <Button size="sm" onClick={() => (isLast ? finish() : setStep((s) => s + 1))}>
            {isLast ? "Entendido" : "Siguiente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
