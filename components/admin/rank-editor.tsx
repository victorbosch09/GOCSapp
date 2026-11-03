"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateRank, createRank } from "@/lib/actions/admin";
import { formatCredits } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import type { Rank } from "@/types/database";

export function RankEditor({ ranks }: { ranks: Rank[] }) {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowNew((v) => !v)}
          className="gap-2"
        >
          <Plus size={14} />
          Nuevo rango
          {showNew ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>

      {showNew && (
        <NewRankForm
          nextSortOrder={Math.max(0, ...ranks.map((r) => r.sort_order)) + 10}
          onCreated={() => setShowNew(false)}
        />
      )}

      {ranks.map((rank) => (
        <RankCard key={rank.id} rank={rank} />
      ))}
    </div>
  );
}

function NewRankForm({
  nextSortOrder,
  onCreated,
}: {
  nextSortOrder: number;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [wage, setWage] = useState("0");
  const [description, setDescription] = useState("");
  const [requirement, setRequirement] = useState("");
  const [sortOrder, setSortOrder] = useState(String(nextSortOrder));
  const [pending, startTransition] = useTransition();

  function save() {
    if (!name.trim()) { toast.error("El nombre es requerido."); return; }
    if (!abbreviation.trim()) { toast.error("La abreviatura es requerida."); return; }
    const parsedWage = Number(wage);
    if (Number.isNaN(parsedWage) || parsedWage < 0) { toast.error("Sueldo inválido."); return; }
    const parsedSort = Number(sortOrder);
    if (Number.isNaN(parsedSort)) { toast.error("Orden inválido."); return; }

    startTransition(async () => {
      const result = await createRank({
        name: name.trim(),
        abbreviation: abbreviation.trim(),
        weekly_wage: parsedWage,
        description: description.trim(),
        promotion_requirement: requirement.trim(),
        sort_order: parsedSort,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Rango "${name}" creado.`);
        onCreated();
      }
    });
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base text-primary">Nuevo rango</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-2">
            <Label>Nombre</Label>
            <Input
              placeholder="ej. Operador LVL2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Abreviatura</Label>
            <Input
              placeholder="ej. ON-2"
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              className="uppercase"
              maxLength={10}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Sueldo semanal (cr)</Label>
            <Input
              type="number"
              min={0}
              value={wage}
              onChange={(e) => setWage(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Orden (sort_order)</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Descripción</Label>
          <Textarea
            placeholder="Breve descripción del rango..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Requisito de ascenso</Label>
          <Textarea
            placeholder="ej. Mod 1-6 y 8 contratos cumplidos."
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            rows={2}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={pending} className="gap-2">
            <Plus size={14} />
            {pending ? "Creando..." : "Crear rango"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function RankCard({ rank }: { rank: Rank }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState(rank.name);
  const [abbreviation, setAbbreviation] = useState(rank.abbreviation);
  const [wage, setWage] = useState(String(rank.weekly_wage));
  const [description, setDescription] = useState(rank.description ?? "");
  const [requirement, setRequirement] = useState(rank.promotion_requirement ?? "");
  const reqs = rank.requirements_json ?? {};
  const [reqModules, setReqModules] = useState(reqs.modules?.join(",") ?? "");
  const [reqAttendance, setReqAttendance] = useState(String(reqs.attendance_days ?? ""));
  const [reqContracts, setReqContracts] = useState(String(reqs.contracts ?? ""));
  const [reqSpecialty, setReqSpecialty] = useState(String(reqs.specialty_courses ?? ""));
  const [reqMissionDays, setReqMissionDays] = useState(String(reqs.mission_days ?? ""));
  const [reqLeadership, setReqLeadership] = useState(reqs.leadership_course ?? "");
  const [reqNote, setReqNote] = useState(reqs.note ?? "");
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  function mark() { setDirty(true); }

  function save() {
    const parsedWage = Number(wage);
    if (Number.isNaN(parsedWage) || parsedWage < 0) { toast.error("Sueldo inválido."); return; }
    if (!name.trim()) { toast.error("El nombre es requerido."); return; }
    if (!abbreviation.trim()) { toast.error("La abreviatura es requerida."); return; }

    const modules = reqModules.trim()
      ? reqModules.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n))
      : undefined;

    const requirements_json: Record<string, unknown> = {};
    if (modules?.length) requirements_json.modules = modules;
    if (reqAttendance) requirements_json.attendance_days = Number(reqAttendance);
    if (reqContracts) requirements_json.contracts = Number(reqContracts);
    if (reqSpecialty) requirements_json.specialty_courses = Number(reqSpecialty);
    if (reqMissionDays) requirements_json.mission_days = Number(reqMissionDays);
    if (reqLeadership.trim()) requirements_json.leadership_course = reqLeadership.trim();
    if (reqNote.trim()) requirements_json.note = reqNote.trim();

    startTransition(async () => {
      const result = await updateRank(rank.id, {
        name: name.trim(),
        abbreviation: abbreviation.trim().toUpperCase(),
        weekly_wage: parsedWage,
        description: description.trim() || null,
        promotion_requirement: requirement.trim() || null,
        requirements_json: Object.keys(requirements_json).length ? requirements_json : null,
      });
      if (result?.error) toast.error(result.error);
      else {
        toast.success(`${name} actualizado.`);
        setDirty(false);
      }
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="font-heading text-base">
            {rank.name} <span className="text-muted-foreground text-sm font-normal">({rank.abbreviation})</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            className="gap-1.5 text-xs"
          >
            {expanded ? <><ChevronUp size={13} /> Cerrar</> : <><ChevronDown size={13} /> Editar</>}
          </Button>
        </div>
        {!expanded && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
            <span>{formatCredits(rank.weekly_wage)}/sem</span>
            {rank.promotion_requirement && <span className="truncate">{rank.promotion_requirement}</span>}
          </div>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="flex flex-col gap-4">
          {/* Identity */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Nombre</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); mark(); }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Abreviatura</Label>
              <Input value={abbreviation} onChange={(e) => { setAbbreviation(e.target.value.toUpperCase()); mark(); }} maxLength={10} className="uppercase" />
            </div>
          </div>

          {/* Economics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Sueldo semanal (cr)</Label>
              <Input type="number" min={0} value={wage} onChange={(e) => { setWage(e.target.value); mark(); }} />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Descripción</Label>
            <Textarea value={description} onChange={(e) => { setDescription(e.target.value); mark(); }} rows={2} />
          </div>

          {/* Promotion requirement text */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Texto del requisito de ascenso (visible al soldado)</Label>
            <Textarea value={requirement} onChange={(e) => { setRequirement(e.target.value); mark(); }} rows={2} placeholder="ej. Módulos 1-4 y 8 asistencias a días oficiales." />
          </div>

          {/* Structured requirements */}
          <div className="rounded-lg border border-border/60 bg-muted/10 p-3 flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Requisitos estructurados (barras de progreso)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Módulos (ej: 1,2,3,4)</Label>
                <Input value={reqModules} onChange={(e) => { setReqModules(e.target.value); mark(); }} placeholder="1,2,3,4" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Asistencias oficiales</Label>
                <Input type="number" min={0} value={reqAttendance} onChange={(e) => { setReqAttendance(e.target.value); mark(); }} placeholder="ej: 8" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Contratos</Label>
                <Input type="number" min={0} value={reqContracts} onChange={(e) => { setReqContracts(e.target.value); mark(); }} placeholder="ej: 30" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Cursos especializados</Label>
                <Input type="number" min={0} value={reqSpecialty} onChange={(e) => { setReqSpecialty(e.target.value); mark(); }} placeholder="ej: 1" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Días de misión de prueba</Label>
                <Input type="number" min={0} value={reqMissionDays} onChange={(e) => { setReqMissionDays(e.target.value); mark(); }} placeholder="ej: 4" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Curso de liderazgo requerido</Label>
                <Input value={reqLeadership} onChange={(e) => { setReqLeadership(e.target.value); mark(); }} placeholder="ej: Curso Líder de Equipo" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Nota especial</Label>
              <Input value={reqNote} onChange={(e) => { setReqNote(e.target.value); mark(); }} placeholder="ej: Requiere votación de mando." />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" disabled={!dirty || pending} onClick={save}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
