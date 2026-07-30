import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRINCIPLES = [
  {
    title: "Coordinación sobre individualismo",
    body: "Una acción individual brillante que rompe la coordinación del equipo vale menos que una acción promedio ejecutada en sincronía.",
  },
  {
    title: "Comunicación clara y oportuna",
    body: "La información que no se comunica no existe. El silencio en campo tiene consecuencias.",
  },
  {
    title: "Respeto a la cadena de mando",
    body: "Durante un contrato activo, las decisiones del mando de turno se acatan. Las discusiones tácticas tienen su momento.",
  },
  {
    title: "Convivencia",
    body: "El respeto entre operadores es innegociable. Todo operador tiene voz; el irrespeto no tiene lugar en el G.O.C.S.",
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-20 text-center md:py-28">
          <Image
            src="/brand/gocs-logo-skull.png"
            alt="G.O.C.S."
            width={140}
            height={140}
            priority
            className="drop-shadow-[0_0_40px_rgba(178,20,28,0.25)]"
          />
          <div className="space-y-3">
            <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
              Organización Latinoamericana de Defensa
            </p>
            <h1 className="font-heading text-4xl leading-tight md:text-6xl">
              Grupo Operacional
              <br />
              <span className="text-gocs-red">Comando Sur</span>
            </h1>
            <p className="mx-auto max-w-2xl text-balance text-muted-foreground">
              Comunidad hispana de milsim en Arma Reforger. Operamos como Compañía Militar Privada
              bajo el paraguas de la OLAD, enfrentando al crimen organizado en un universo ficticio
              construido colectivamente, contrato a contrato.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/registro">Postularme al G.O.C.S.</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Ya soy operador</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20">
        <h2 className="font-heading text-center text-2xl md:text-3xl">¿Qué es el G.O.C.S.?</h2>
        <p className="mx-auto mt-6 max-w-3xl text-center text-muted-foreground">
          No somos un clan de videojuegos casual ni una comunidad de juego libre. Somos una
          organización con identidad propia, estructura definida, doctrina operacional y una
          narrativa en construcción colectiva que cada sesión amplía y enriquece. Cada contrato
          tiene consecuencias dentro del lore — las decisiones tomadas en campo importan y quedan
          registradas.
        </p>
        <blockquote className="mx-auto mt-8 max-w-xl border-l-2 border-gocs-red pl-4 text-center text-lg italic text-foreground/90">
          &ldquo;La honestidad de las personas con las que simulamos&rdquo; es lo que más valoramos,
          por encima de la puntería o la experiencia previa.
        </blockquote>
      </section>

      <section className="border-t border-border/60 bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-heading text-center text-2xl md:text-3xl">
            Principios operacionales
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <Card key={p.title}>
                <CardHeader>
                  <CardTitle className="font-heading text-base">{p.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{p.body}</CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="font-heading text-2xl md:text-3xl">Primer teatro operativo: Everon</h2>
        <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
          Nueve contratos ejecutados, un cartel desarticulado y una pista que no termina en la
          isla. La Operación Punto Cero cerró su primer teatro — el siguiente es GulfCoast. La
          organización sigue creciendo y necesita más operadores.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/registro">Sumate a la próxima operación</Link>
        </Button>
      </section>
    </>
  );
}
