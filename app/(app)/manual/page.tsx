import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Manual del Operador V2 — G.O.C.S." };

const RANKS = [
  { abbr: "REC", name: "Recluta", salary: 0, desc: "Ingresa al servidor, sin acceso a operaciones." },
  { abbr: "OPR", name: "Operador", salary: 500, desc: "Acceso a operaciones básicas. Sueldo base." },
  { abbr: "EXP", name: "Especialista", salary: 750, desc: "Módulos completados. Operaciones especiales." },
  { abbr: "SGT", name: "Sargento", salary: 1000, desc: "Liderazgo de escuadra. Gestión de efectivos." },
  { abbr: "LT", name: "Teniente", salary: 1400, desc: "Mando de pelotón. Decisiones tácticas." },
  { abbr: "CPT", name: "Capitán", salary: 1800, desc: "Mando de compañía. Planificación operacional." },
  { abbr: "MAY", name: "Mayor", salary: 2200, desc: "Mando superior. Gestión estratégica." },
  { abbr: "CMD", name: "Comandante", salary: 2800, desc: "Alto mando. Dirección de G.O.C.S." },
];

const MODULES = [
  { cat: "Básico", items: ["Protocolo de comunicaciones", "Uso de equipamiento estándar", "Reglas de enfrentamiento", "Mapa y navegación táctica"] },
  { cat: "Combate", items: ["CQB (Combate en espacios cerrados)", "Supresión y fuego de apoyo", "Tácticas de infiltración", "Extracción bajo fuego"] },
  { cat: "Especialización", items: ["Francotirador avanzado", "Demoliciones y explosivos", "Reconocimiento aéreo", "Guerra electrónica básica"] },
  { cat: "Liderazgo", items: ["Gestión de escuadra", "Planificación táctica", "Briefs de operación", "Evaluación post-misión"] },
];

const SPECIALTIES = [
  { id: "ASLT", label: "Asalto", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "SNPR", label: "Francotirador", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  { id: "MED", label: "Sanitario", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  { id: "ENG", label: "Ingeniero", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "RCN", label: "Reconocimiento", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "CMD", label: "Mando", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
];

const CONTRACTS = [
  { risk: "Bajo", bonus: "200–400", desc: "Operaciones de rutina, patrullaje, escolta." },
  { risk: "Medio", bonus: "500–800", desc: "Infiltración, reconocimiento en zona hostil." },
  { risk: "Alto", bonus: "900–1.400", desc: "Asalto directo, extracción de VIP, demoliciones." },
  { risk: "Crítico", bonus: "1.500–3.000", desc: "Operaciones de alto secreto, alta probabilidad de bajas." },
];

const CONDUCT = [
  "Respeto absoluto a la cadena de mando dentro de operaciones.",
  "Prohibido el fuego amigo intencional o el teamkill reiterado.",
  "Comunicaciones claras y concisas; no usar lenguaje ofensivo.",
  "Asistencia mínima del 60% mensual para mantener el rango activo.",
  "Notificar ausencias con 48 h de anticipación al superior directo.",
  "No revelar información de operaciones a personal externo a G.O.C.S.",
  "Todo activo adquirido en la tienda es de uso exclusivo en operaciones.",
  "El mando puede aplicar sanciones por conducta indebida previo proceso.",
];

const ECONOMY = [
  { title: "Sueldo base", detail: "Cobrado automáticamente al inicio de cada semana operativa según rango activo." },
  { title: "Bonos por operación", detail: "El mando los asigna tras cada misión según desempeño individual y resultado." },
  { title: "Contratos", detail: "Generan créditos adicionales al completar el objetivo marcado en el contrato." },
  { title: "Tienda", detail: "Armamento y vehículos disponibles para compra. Reventa al 50% del precio original." },
  { title: "Sanciones económicas", detail: "Infracciones graves pueden resultar en descuentos directos al balance." },
  { title: "Racha diaria", detail: "+50 cr al ingresar al portal. Rachas de 7 días: +200 cr. 30 días: +500 cr." },
];

export default function ManualPage() {
  return (
    <div className="flex flex-col gap-10 pb-16">

      {/* Header */}
      <div className="card-tactical p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-2xl font-bold text-primary">
            G
          </div>
          <div>
            <h1 className="font-heading text-3xl text-foreground">Manual del Operador</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Versión 2.0 — G.O.C.S. Grupo de Operaciones y Combate Simulado
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="border-primary/40 text-primary">Clasificado: Interno</Badge>
              <Badge variant="outline" className="text-muted-foreground">Rev. 2026</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Ranks */}
      <section className="flex flex-col gap-4">
        <p className="section-header">
          <span className="h-1 w-3 rounded-full bg-primary shrink-0" />
          Estructura de Rangos
        </p>
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Abrev.</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Rango</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground hidden sm:table-cell">Sueldo / semana</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground hidden md:table-cell">Descripción</th>
              </tr>
            </thead>
            <tbody>
              {RANKS.map((r, i) => (
                <tr key={r.abbr} className={`border-b border-border/50 ${i === RANKS.length - 1 ? "border-0" : ""}`}>
                  <td className="px-4 py-3">
                    <span className="font-heading text-xs font-bold text-primary">{r.abbr}</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {r.salary > 0 ? `${r.salary.toLocaleString()} cr` : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modules */}
      <section className="flex flex-col gap-4">
        <p className="section-header">
          <span className="h-1 w-3 rounded-full bg-primary shrink-0" />
          Módulos de Entrenamiento
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => (
            <div key={m.cat} className="card-tactical p-4 flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">{m.cat}</p>
              <ul className="flex flex-col gap-1.5">
                {m.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Specialties */}
      <section className="flex flex-col gap-4">
        <p className="section-header">
          <span className="h-1 w-3 rounded-full bg-primary shrink-0" />
          Especialidades
        </p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((s) => (
            <span
              key={s.id}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-semibold ${s.color}`}
            >
              <span className="font-heading text-xs opacity-70">{s.id}</span>
              {s.label}
            </span>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Las especialidades se asignan tras completar los módulos requeridos y aprobación del mando.
          Cada operador puede tener hasta 2 especialidades activas.
        </p>
      </section>

      {/* Contracts */}
      <section className="flex flex-col gap-4">
        <p className="section-header">
          <span className="h-1 w-3 rounded-full bg-primary shrink-0" />
          Contratos y Niveles de Riesgo
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CONTRACTS.map((c) => (
            <div key={c.risk} className="card-tactical p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Riesgo {c.risk}
                </span>
                <span className="font-heading text-sm font-bold text-primary">{c.bonus} cr</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Economy */}
      <section className="flex flex-col gap-4">
        <p className="section-header">
          <span className="h-1 w-3 rounded-full bg-primary shrink-0" />
          Sistema Económico
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ECONOMY.map((e) => (
            <div key={e.title} className="card-tactical p-4 flex flex-col gap-1.5">
              <p className="text-sm font-semibold text-foreground">{e.title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{e.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Code of Conduct */}
      <section className="flex flex-col gap-4">
        <p className="section-header">
          <span className="h-1 w-3 rounded-full bg-primary shrink-0" />
          Código de Conducta
        </p>
        <div className="card-tactical p-5 flex flex-col gap-0">
          {CONDUCT.map((rule, i) => (
            <div key={i} className={`flex items-start gap-3 py-3 ${i < CONDUCT.length - 1 ? "border-b border-border/50" : ""}`}>
              <span className="font-heading mt-0.5 shrink-0 text-xs font-bold text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="text-sm text-foreground/90">{rule}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <div className="rounded-lg border border-border/50 bg-muted/20 px-5 py-4 text-xs text-muted-foreground">
        Este manual es de uso interno exclusivo para miembros de G.O.C.S. Su contenido puede ser actualizado
        por el alto mando sin previo aviso. Consulta a tu superior directo ante cualquier duda operacional.
      </div>

    </div>
  );
}
