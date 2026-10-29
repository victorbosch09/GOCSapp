"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { bulkAssignSkill, bulkAwardBonus, bulkApplySanction, bulkAwardReward } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Profile, Rank } from "@/types/database";

type ProfileRow = Profile & { rank: Rank | null };
type Skill = { id: string; name: string; category: string | null };
type Tab = "modulos" | "bonus" | "sanciones" | "recompensas";

const SEVERITY_OPTS = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "grave", label: "Grave" },
  { value: "extrema", label: "Extrema" },
] as const;

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

  // Module/skill state
  const [skillId, setSkillId] = useState("");
  const [skillResult, setSkillResult] = useState<"aprobado" | "en_progreso" | "no_aprobado">("aprobado");
  const [skillNotes, setSkillNotes] = useState("");

  // Bonus state
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusDetail, setBonusDetail] = useState("");
  const [bonusNotes, setBonusNotes] = useState("");

  // Sanction state
  const [sanctionSeverity, setSanctionSeverity] = useState<"leve" | "moderada" | "grave" | "extrema">("leve");
  const [sanctionDesc, setSanctionDesc] = useState("");
  const [sanctionAmount, setSanctionAmount] = useState("");

  // Reward state
  const [rewardTitle, setRewardTitle] = useState("");
  const [rewardDesc, setRewardDesc] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");

  const approved = profiles.filter((p) => p.approved);
  const filtered = approved.filter((p) =>
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

  const ids = Array.from(selected);

  function onSkillPreset(s: Skill) {
    setSkillId(s.id);
  }

  // Group skills by category
  const skillsByCategory = skills.reduce<Record<string, Skill[]>>((acc, s) => {
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
        result = await bulkAssignSkill({ profileIds: ids, skillId, result: skillResult, notes: skillNotes || undefined });
      } else if (tab === "bonus") {
        const amt = parseFloat(bonusAmount);
        result = await bulkAwardBonus({ profileIds: ids, amount: amt, detail: bonusDetail, notes: bonusNotes || undefined });
      } else if (tab === "sanciones") {
        const amt = sanctionAmount ? parseFloat(sanctionAmount) : null;
        result = await bulkApplySanction({ profileIds: ids, severity: sanctionSeverity, description: sanctionDesc, amountDeducted: amt });
      } else {
        const amt = rewardAmount ? parseFloat(rewardAmount) : null;
        result = await bulkAwardReward({ profileIds: ids, title: rewardTitle, description: rewardDesc, amount: amt });
      }

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Operación aplicada a ${"count" in result ? result.count : ids.length} operadores.`);
        setSelected(new Set());
        // Reset forms
        setSkillNotes(""); setBonusAmount(""); setBonusDetail(""); setBonusNotes("");
        setSanctionDesc(""); setSanctionAmount(""); setRewardTitle(""); setRewardDesc(""); setRewardAmount("");
      }
    });
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "modulos", label: "Módulos / Cursos" },
    { key: "bonus", label: "Bonos" },
    { key: "sanciones", label: "Sanciones" },
    { key: "recompensas", label: "Recompensas" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left — operator picker */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
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
                  className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/30 ${
                    selected.has(p.id) ? "bg-primary/10" : ""
                  }`}
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
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab === t.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="card-tactical p-4 flex flex-col gap-4">
          {tab === "modulos" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Módulo / Curso</Label>
                <Select value={skillId} onValueChange={setSkillId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccioná un módulo o curso…" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                      <div key={cat}>
                        <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{cat}</p>
                        {catSkills.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
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
                <Input value={skillNotes} onChange={(e) => setSkillNotes(e.target.value)} placeholder="Ej: aprobado en entrenamiento del 15/11" />
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

          {tab === "sanciones" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Severidad</Label>
                <Select value={sanctionSeverity} onValueChange={(v) => setSanctionSeverity(v as typeof sanctionSeverity)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Descripción</Label>
                <Textarea value={sanctionDesc} onChange={(e) => setSanctionDesc(e.target.value)} placeholder="Razón de la sanción…" rows={3} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Descuento en créditos (opcional)</Label>
                <Input type="number" value={sanctionAmount} onChange={(e) => setSanctionAmount(e.target.value)} placeholder="0" />
              </div>
            </>
          )}

          {tab === "recompensas" && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Título de la recompensa</Label>
                <Input value={rewardTitle} onChange={(e) => setRewardTitle(e.target.value)} placeholder="Ej: Mejor operador del mes" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Descripción</Label>
                <Textarea value={rewardDesc} onChange={(e) => setRewardDesc(e.target.value)} placeholder="Descripción opcional…" rows={3} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Monto en créditos (opcional)</Label>
                <Input type="number" value={rewardAmount} onChange={(e) => setRewardAmount(e.target.value)} placeholder="0" />
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
              : `Aplicar a ${ids.length} operador${ids.length !== 1 ? "es" : ""}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
