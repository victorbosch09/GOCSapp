"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { bulkAssignSkills, bulkAwardBonus } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { Profile, Rank } from "@/types/database";

type ProfileRow = Profile & { rank: Rank | null };
type Skill = { id: string; name: string; category: string | null };
type Tab = "modulos" | "bonus";

const BONUS_PRESETS = [
  { label: "Infiltración exitosa", amount: 300 },
  { label: "Extracción exitosa", amount: 400 },
  { label: "OAV capturado", amount: 700 },
  { label: "Sin bajas", amount: 500 },
  { label: "Recuperación de inteligencia", amount: 600 },
  { label: "Operación nocturna", amount: 350 },
  { label: "Supervivencia", amount: 250 },
];

export function BulkOpsPanel({
  profiles,
  skills,
}: {
  profiles: ProfileRow[];
  skills: Skill[];
}) {
  const [tab, setTab] = useState<Tab>("modulos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  // Multi-skill state
  const [selectedSkillIds, setSelectedSkillIds] = useState<Set<string>>(new Set());
  const [skillSearch, setSkillSearch] = useState("");
  const [skillResult, setSkillResult] = useState<"aprobado" | "en_progreso" | "no_aprobado">("aprobado");
  const [skillNotes, setSkillNotes] = useState("");

  // Bonus state
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusDetail, setBonusDetail] = useState("");
  const [bonusNotes, setBonusNotes] = useState("");

  const approved = profiles.filter((p) => p.approved);
  const filtered = approved.filter(
    (p) =>
      search.trim() === "" ||
      p.callsign.toLowerCase().includes(search.toLowerCase()) ||
      (p.squad ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  }

  function toggleSkill(id: string) {
    setSelectedSkillIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const ids = Array.from(selected);
  const skillIds = Array.from(selectedSkillIds);

  // Group skills by category, filtered by skillSearch
  const filteredSkills = skillSearch.trim()
    ? skills.filter((s) => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
    : skills;

  const skillsByCategory = filteredSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    const cat = s.category ?? "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  function handleSubmit() {
    if (ids.length === 0) {
      toast.error("Seleccioná al menos un operador.");
      return;
    }
    startTransition(async () => {
      let result;
      if (tab === "modulos") {
        if (skillIds.length === 0) { toast.error("Seleccioná al menos un módulo o curso."); return; }
        result = await bulkAssignSkills({
          profileIds: ids,
          skillIds,
          result: skillResult,
          notes: skillNotes || undefined,
        });
      } else {
        const amt = parseFloat(bonusAmount);
        if (isNaN(amt) || amt <= 0) { toast.error("Ingresá un monto válido."); return; }
        result = await bulkAwardBonus({ profileIds: ids, amount: amt, detail: bonusDetail, notes: bonusNotes || undefined });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        const count = "count" in result ? result.count : ids.length;
        toast.success(`Operación aplicada. ${count} evaluación${count !== 1 ? "es" : ""} registrada${count !== 1 ? "s" : ""}.`);
        setSelected(new Set());
        setSelectedSkillIds(new Set());
        setSkillNotes("");
        setBonusAmount(""); setBonusDetail(""); setBonusNotes("");
      }
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "modulos", label: "Módulos / Cursos" },
    { key: "bonus", label: "Bonos" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Left — operator picker */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Buscar por callsign o escuadra…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={toggleAll}>
            {selected.size === filtered.length && filtered.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
          </Button>
          {selected.size > 0 && (
            <Badge variant="secondary">{selected.size} seleccionados</Badge>
          )}
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="w-10 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="accent-primary"
                  />
                </th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Callsign</th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Rango</th>
                <th className="px-3 py-2 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Escuadra</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    Sin resultados.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => toggleOne(p.id)}
                  className={cn(
                    "cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30",
                    selected.has(p.id) && "bg-primary/10"
                  )}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleOne(p.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium">{p.callsign}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.rank?.abbreviation ?? "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.squad ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right — operation panel */}
      <div className="flex flex-col gap-4">
        {/* Tab selector */}
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors",
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="card-tactical p-4 flex flex-col gap-4">
          {tab === "modulos" && (
            <>
              {/* Multi-skill selector */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>Módulos / Cursos</Label>
                  {selectedSkillIds.size > 0 && (
                    <span className="text-xs text-primary font-semibold">
                      {selectedSkillIds.size} seleccionado{selectedSkillIds.size !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Selected badges */}
                {selectedSkillIds.size > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(selectedSkillIds).map((sid) => {
                      const s = skills.find((x) => x.id === sid);
                      if (!s) return null;
                      return (
                        <span
                          key={sid}
                          className="flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 text-primary px-2 py-0.5 text-xs font-medium"
                        >
                          {s.name}
                          <button onClick={() => toggleSkill(sid)} className="ml-0.5 hover:text-primary/70">
                            <X size={10} />
                          </button>
                        </span>
                      );
                    })}
                    <button
                      onClick={() => setSelectedSkillIds(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      Limpiar
                    </button>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={skillSearch}
                    onChange={(e) => setSkillSearch(e.target.value)}
                    placeholder="Buscar módulo o curso…"
                    className="pl-8 text-sm h-8"
                  />
                </div>

                {/* Scrollable checklist grouped by category */}
                <div className="max-h-56 overflow-y-auto rounded-md border border-border divide-y divide-border/50">
                  {Object.keys(skillsByCategory).length === 0 && (
                    <p className="px-3 py-4 text-xs text-muted-foreground text-center">Sin resultados.</p>
                  )}
                  {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                    <div key={cat}>
                      <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/30 sticky top-0">
                        {cat}
                      </p>
                      {catSkills.map((s) => (
                        <label
                          key={s.id}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 cursor-pointer text-sm transition-colors hover:bg-muted/30",
                            selectedSkillIds.has(s.id) && "bg-primary/8 text-primary"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSkillIds.has(s.id)}
                            onChange={() => toggleSkill(s.id)}
                            className="accent-primary shrink-0"
                          />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Resultado</Label>
                <Select value={skillResult} onValueChange={(v) => setSkillResult(v as typeof skillResult)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="no_aprobado">No aprobado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Notas (opcional)</Label>
                <Input
                  value={skillNotes}
                  onChange={(e) => setSkillNotes(e.target.value)}
                  placeholder="Ej: aprobado en entrenamiento del 15/11"
                />
              </div>
            </>
          )}

          {tab === "bonus" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Bonos rápidos</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BONUS_PRESETS.map((bp) => (
                    <button
                      key={bp.label}
                      onClick={() => { setBonusDetail(bp.label); setBonusAmount(String(bp.amount)); }}
                      className="rounded border border-border px-2 py-1 text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      {bp.label} (+{bp.amount})
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Detalle</Label>
                <Input value={bonusDetail} onChange={(e) => setBonusDetail(e.target.value)} placeholder="Ej: Infiltración exitosa" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Monto (cr)</Label>
                <Input type="number" value={bonusAmount} onChange={(e) => setBonusAmount(e.target.value)} placeholder="300" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Notas (opcional)</Label>
                <Input value={bonusNotes} onChange={(e) => setBonusNotes(e.target.value)} placeholder="Contexto adicional" />
              </div>
            </>
          )}

          <Button
            onClick={handleSubmit}
            disabled={pending || ids.length === 0}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {pending
              ? "Aplicando…"
              : ids.length === 0
              ? "Seleccioná operadores"
              : tab === "modulos" && skillIds.length > 1
              ? `Aplicar ${skillIds.length} cursos a ${ids.length} operador${ids.length !== 1 ? "es" : ""}`
              : `Aplicar a ${ids.length} operador${ids.length !== 1 ? "es" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
