import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manual del Operador — G.O.C.S." };

const RANKS = [
  { abbr: "Rct.", name: "Recluta", wage: 500, notes: "Ingreso al clan. Período de prueba." },
  { abbr: "Op.", name: "Operador", wage: 700, notes: "Operador activo con módulos básicos." },
  { abbr: "Op. 1ra.", name: "Operador de 1ra Clase", wage: 900, notes: "Experiencia consolidada." },
  { abbr: "Sgt.", name: "Sargento", wage: 1100, notes: "Líder de escuadra en formación." },
  { abbr: "Sgt. 1ro.", name: "Sargento de 1ra Clase", wage: 1400, notes: "Liderazgo probado." },
  { abbr: "Ss.", name: "Sub Sargento", wage: 1700, notes: "Mando intermedio." },
  { abbr: "Sub. Ten.", name: "Sub Teniente", wage: 2100, notes: "Oficial subalterno." },
  { abbr: "Ten.", name: "Teniente", wage: 2600, notes: "Oficial de sección." },
  { abbr: "Cap.", name: "Capitán", wage: 3200, notes: "Mando de compañía." },
  { abbr: "Cdte.", name: "Comandante", wage: 4000, notes: "Alto mando operacional." },
];

const MODULES = [
  { name: "Módulo Básico de Infantería (MBI)", cat: "Básico", desc: "Combate a pie, movimiento táctico, comunicaciones básicas. Obligatorio para ascender a Op." },
  { name: "Módulo de Vehículos Terrestres (MVT)", cat: "Básico", desc: "Conducción y combate en vehículos blindados ligeros." },
  { name: "Módulo de Aviación (MAV)", cat: "Especializado", desc: "Pilotaje de helicópteros de transporte y combate." },
  { name: "Módulo de Francotirador (MFR)", cat: "Especializado", desc: "Operaciones de largo alcance, observación y designación." },
  { name: "Módulo de Operaciones Nocturnas (MON)", cat: "Especializado", desc: "Combate y reconocimiento en condiciones de baja visibilidad." },
  { name: "Módulo de Comando y Estado Mayor (MCEM)", cat: "Alto Mando", desc: "Planificación operacional, inteligencia y liderazgo estratégico." },
];

const BONUSES = [
  { label: "Infiltración exitosa", amount: 300 },
  { label: "Extracción exitosa", amount: 400 },
  { label: "OAV capturado", amount: 700 },
  { label: "Sin bajas propias", amount: 500 },
  { label: "Recuperación de inteligencia", amount: 600 },
  { label: "Operación nocturna", amount: 350 },
  { label: "Supervivencia", amount: 250 },
];

const CONTRACTS = [
  { level: 1, baseWage: "Sueldo × 1.0", risk: "Bajo", desc: "Patrullas rutinarias y control de zona." },
  { level: 2, baseWage: "Sueldo × 1.5", risk: "Medio", desc: "Reconocimiento y extracción de activos." },
  { level: 3, baseWage: "Sueldo × 2.0", risk: "Alto", desc: "Infiltración y operaciones de alto valor." },
  { level: 4, baseWage: "Sueldo × 3.0", risk: "Crítico", desc: "Misiones de elite bajo contacto enemigo sostenido." },
];

const CONDUCT = [
  "Respetar la jerarquía de mando en todo momento.",
  "Comunicación disciplinada en canales oficiales.",
  "Asistencia mínima del 70 % a eventos programados.",
  "Prohibido el fuego amigo intencional.",
  "Reportar bajas y situaciones críticas al mando inmediato.",
  "Actitud profesional con miembros de otras unidades.",
  "No divulgar información táctica fuera del clan.",
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-header mt-2">{children}</div>
  );
}

export default function ManualPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div>
        <h1 className="font-heading text-3xl">Manual del Operador</h1>
        <p className="text-muted-foreground mt-1">Versión 2 — G.O.C.S. Documento de referencia para todos los operadores.</p>
      </div>

      {/* Escalafón */}
      <section>
        <SectionTitle>Escalafón de Rangos</SectionTitle>
        <div className="card-tactical overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Abrev.</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Rango</th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-xs text-muted-foreground">Sueldo / semana</th>
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground hidden sm:table-cell">Notas</th>
              </tr>
            </thead>
            <tbody>
              {RANKS.map((r) => (
                <tr key={r.abbr} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-primary">{r.abbr}</td>
                  <td className="px-4 py-2.5 font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-400">{r.wage.toLocaleString()} cr</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Módulos */}
      <section>
        <SectionTitle>Módulos y Cursos</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODULES.map((m) => (
            <div key={m.name} className="card-tactical p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/20 text-primary">{m.cat}</span>
              </div>
              <p className="font-medium text-sm">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contratos */}
      <section>
        <SectionTitle>Sistema de Contratos</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTRACTS.map((c) => (
            <div key={c.level} className="card-tactical p-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="font-heading text-base">Nivel {c.level}</span>
                <span className={`text-xs font-semibold uppercase tracking-wide ${c.level >= 3 ? "text-primary" : "text-muted-foreground"}`}>{c.risk}</span>
              </div>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
              <p className="text-xs font-medium text-emerald-400">Pago: {c.baseWage}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Los bonos de rendimiento se acumulan al pago base del contrato.</p>
      </section>

      {/* Bonos de rendimiento */}
      <section>
        <SectionTitle>Bonos de Rendimiento en Operaciones</SectionTitle>
        <div className="card-tactical overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left font-semibold uppercase tracking-wide text-xs text-muted-foreground">Logro</th>
                <th className="px-4 py-2.5 text-right font-semibold uppercase tracking-wide text-xs text-muted-foreground">Bono</th>
              </tr>
            </thead>
            <tbody>
              {BONUSES.map((b) => (
                <tr key={b.label} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-2.5">{b.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-emerald-400">+{b.amount} cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Economía */}
      <section>
        <SectionTitle>Sistema Económico</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { title: "Sueldo semanal", body: "Se abona automáticamente cada viernes según el rango activo del operador." },
            { title: "Racha diaria", body: "Abre la app cada día para ganar +50 cr. Bonus de 200 cr al día 7 y 500 cr al día 30." },
            { title: "Tienda de armamento", body: "Adquirí equipamiento con créditos. Los ítems se revenden al 50 % del precio original." },
          ].map((i) => (
            <div key={i.title} className="card-tactical p-4">
              <p className="font-semibold text-sm mb-1">{i.title}</p>
              <p className="text-xs text-muted-foreground">{i.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Código de conducta */}
      <section>
        <SectionTitle>Código de Conducta</SectionTitle>
        <div className="card-tactical p-4">
          <ul className="flex flex-col gap-2">
            {CONDUCT.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="text-xs text-muted-foreground pb-4">Manual del Operador G.O.C.S. v2 — Sujeto a modificaciones por el Alto Mando.</p>
    </div>
  );
}
